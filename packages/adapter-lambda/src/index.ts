/**
 * @vura/adapter-lambda
 *
 * Generates AWS Lambda + API Gateway deployment artifacts from Vura build output.
 * Produces a SAM template, per-function handler files, and samconfig.toml.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import type { RouteManifest, TaskManifest } from '@vura/build';

// ─── Public Types ───

export interface LambdaAdapterOptions {
  /** AWS region (default: us-east-1) */
  region?: string;
  /** Lambda memory in MB (default: 256) */
  memory?: number;
  /** Lambda timeout in seconds (default: 30) */
  timeout?: number;
  /** CloudFormation stack name (default: vura-app) */
  stackName?: string;
  /** Lambda runtime (default: nodejs22.x) */
  runtime?: string;
  /** Lambda architecture (default: arm64) */
  architecture?: 'x86_64' | 'arm64';
}

export interface VuraAdapter {
  name: string;
  buildEnd(options: {
    serverEntry: string;
    clientDir: string;
    staticDir: string;
    routes: RouteManifest;
    tasks: TaskManifest;
  }): Promise<void>;
  entryTemplate: string;
}

export interface APIGatewayProxyEventV2 {
  version: '2.0';
  routeKey: string;
  rawPath: string;
  rawQueryString: string;
  headers: Record<string, string | undefined>;
  queryStringParameters?: Record<string, string | undefined>;
  pathParameters?: Record<string, string | undefined>;
  body?: string;
  isBase64Encoded: boolean;
  requestContext: {
    accountId: string;
    apiId: string;
    domainName: string;
    domainPrefix: string;
    http: {
      method: string;
      path: string;
      protocol: string;
      sourceIp: string;
      userAgent: string;
    };
    requestId: string;
    routeKey: string;
    stage: string;
    time: string;
    timeEpoch: number;
  };
  stageVariables?: Record<string, string | undefined>;
  cookies?: string[];
}

export interface APIGatewayProxyResultV2 {
  statusCode: number;
  headers?: Record<string, string>;
  body?: string;
  isBase64Encoded?: boolean;
  cookies?: string[];
}

export interface LambdaContext {
  functionName: string;
  functionVersion: string;
  invokedFunctionArn: string;
  memoryLimitInMB: string;
  awsRequestId: string;
  logGroupName: string;
  logStreamName: string;
  getRemainingTimeInMillis(): number;
}

// ─── Lambda Event <-> Web Standard Conversion ───

export function eventToRequest(event: APIGatewayProxyEventV2): Request {
  const {
    rawPath,
    rawQueryString,
    headers,
    body,
    isBase64Encoded,
    requestContext,
  } = event;

  const protocol = headers['x-forwarded-proto'] ?? 'https';
  const host = headers['host'] ?? requestContext.domainName;
  const queryPart = rawQueryString ? `?${rawQueryString}` : '';
  const url = `${protocol}://${host}${rawPath}${queryPart}`;

  const requestHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined) {
      requestHeaders.set(key, value);
    }
  }

  if (event.cookies && event.cookies.length > 0) {
    requestHeaders.set('cookie', event.cookies.join('; '));
  }

  const method = requestContext.http.method.toUpperCase();

  let requestBody: BodyInit | undefined;
  if (body) {
    if (isBase64Encoded) {
      const binaryStr = atob(body);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      requestBody = bytes;
    } else {
      requestBody = body;
    }
  }

  const init: RequestInit = { method, headers: requestHeaders };
  if (method !== 'GET' && method !== 'HEAD' && requestBody !== undefined) {
    init.body = requestBody;
  }

  return new Request(url, init);
}

export async function responseToResult(response: Response): Promise<APIGatewayProxyResultV2> {
  const headers: Record<string, string> = {};
  const cookies: string[] = [];

  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      cookies.push(value);
    } else {
      headers[key] = value;
    }
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isBinary = isBinaryContentType(contentType);

  let body: string | undefined;
  let isBase64Encoded = false;

  if (response.body) {
    if (isBinary) {
      const buffer = await response.arrayBuffer();
      body = arrayBufferToBase64(buffer);
      isBase64Encoded = true;
    } else {
      body = await response.text();
    }
  }

  const result: APIGatewayProxyResultV2 = {
    statusCode: response.status,
    headers,
    body,
    isBase64Encoded,
  };

  if (cookies.length > 0) {
    result.cookies = cookies;
  }

  return result;
}

// ─── createLambdaHandler ───

export function createLambdaHandler(
  app: { handle(request: Request): Promise<Response> | Response },
): (event: APIGatewayProxyEventV2, context: LambdaContext) => Promise<APIGatewayProxyResultV2> {
  return async (event: APIGatewayProxyEventV2, _context: LambdaContext): Promise<APIGatewayProxyResultV2> => {
    const request = eventToRequest(event);
    const response = await app.handle(request);
    return responseToResult(response);
  };
}

// ─── SAM Template Generation ───

interface SamFunction {
  name: string;
  handler: string;
  codeUri: string;
  path: string;
  method: string;
}

function toApiGatewayPath(path: string): string {
  return path.replace(/:(\w+)/g, '{$1}').replace(/\*(\w+)/g, '{$1+}');
}

function toLogicalId(path: string, method: string): string {
  const pathPart = path
    .replace(/^\//, '')
    .replace(/[/:*\-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/_$/, '');
  const id = `${method}${pathPart.charAt(0).toUpperCase()}${pathPart.slice(1)}`;
  return id.replace(/[^a-zA-Z0-9]/g, '');
}

function generateSamTemplate(
  functions: SamFunction[],
  options: Required<Pick<LambdaAdapterOptions, 'memory' | 'timeout' | 'runtime' | 'architecture'>>,
): string {
  const resources: string[] = [];

  resources.push(`  VuraHttpApi:
    Type: AWS::Serverless::HttpApi
    Properties:
      StageName: prod
      CorsConfiguration:
        AllowOrigins:
          - "*"
        AllowMethods:
          - "*"
        AllowHeaders:
          - "*"`);

  for (const fn of functions) {
    const apiPath = toApiGatewayPath(fn.path);
    resources.push(`  ${fn.name}Function:
    Type: AWS::Serverless::Function
    Properties:
      Handler: ${fn.handler}
      CodeUri: ${fn.codeUri}
      Runtime: ${options.runtime}
      Architectures:
        - ${options.architecture}
      MemorySize: ${options.memory}
      Timeout: ${options.timeout}
      Events:
        Api:
          Type: HttpApi
          Properties:
            ApiId: !Ref VuraHttpApi
            Path: ${apiPath}
            Method: ${fn.method}`);
  }

  return `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Vura Application

Globals:
  Function:
    Runtime: ${options.runtime}
    Architectures:
      - ${options.architecture}
    MemorySize: ${options.memory}
    Timeout: ${options.timeout}
    Environment:
      Variables:
        NODE_ENV: production

Resources:
${resources.join('\n\n')}

Outputs:
  ApiUrl:
    Description: API Gateway endpoint URL
    Value: !Sub "https://\${VuraHttpApi}.execute-api.\${AWS::Region}.amazonaws.com/prod"
`;
}

function generateSamConfig(stackName: string, region: string): string {
  return `version = 0.1

[default.deploy.parameters]
stack_name = "${stackName}"
resolve_s3 = true
s3_prefix = "${stackName}"
region = "${region}"
capabilities = "CAPABILITY_IAM"
confirm_changeset = true
`;
}

function generateHandlerFile(route: { path: string; methods: string[] }): string {
  return `// Auto-generated by @vura/adapter-lambda
import { createApp } from '@vura/server';
import { createLambdaHandler } from '@vura/adapter-lambda';
import { ${route.methods.join(', ')} } from './route.js';

const app = createApp();

${route.methods
  .map((method) => {
    const m = method.toLowerCase();
    return `app.${m}('${route.path}', (req, reply) => ${method}(req, reply));`;
  })
  .join('\n')}

export const handler = createLambdaHandler(app);
`;
}

// ─── Adapter Factory ───

export function lambdaAdapter(options: LambdaAdapterOptions = {}): VuraAdapter {
  const region = options.region ?? 'us-east-1';
  const memory = options.memory ?? 256;
  const timeout = options.timeout ?? 30;
  const stackName = options.stackName ?? 'vura-app';
  const runtime = options.runtime ?? 'nodejs22.x';
  const architecture = options.architecture ?? 'arm64';

  return {
    name: 'adapter-lambda',
    entryTemplate: 'lambda-handler',

    async buildEnd({ serverEntry, routes }) {
      const outDir = join(dirname(serverEntry), '..');
      const lambdaDir = join(outDir, 'lambda');
      await mkdir(lambdaDir, { recursive: true });

      const samFunctions: SamFunction[] = [];

      for (const route of routes.api) {
        const routeDirName = route.path
          .replace(/^\//, '')
          .replace(/[/:*]/g, '_')
          .replace(/_+/g, '_')
          .replace(/_$/, '');

        for (const method of route.methods) {
          const funcName = toLogicalId(route.path, method);
          const funcDir = join(lambdaDir, `${routeDirName}_${method.toLowerCase()}`);
          await mkdir(funcDir, { recursive: true });

          const handlerCode = generateHandlerFile(route);
          await writeFile(join(funcDir, 'index.js'), handlerCode);

          samFunctions.push({
            name: funcName,
            handler: 'index.handler',
            codeUri: `lambda/${routeDirName}_${method.toLowerCase()}/`,
            path: route.path,
            method,
          });
        }
      }

      const templateContent = generateSamTemplate(samFunctions, {
        memory,
        timeout,
        runtime,
        architecture,
      });
      await writeFile(join(outDir, 'template.yaml'), templateContent);

      const samConfig = generateSamConfig(stackName, region);
      await writeFile(join(outDir, 'samconfig.toml'), samConfig);
    },
  };
}

// ─── Utilities ───

function isBinaryContentType(contentType: string): boolean {
  if (!contentType) return false;
  return (
    contentType.startsWith('image/') ||
    contentType.startsWith('audio/') ||
    contentType.startsWith('video/') ||
    contentType.startsWith('application/octet-stream') ||
    contentType.startsWith('application/pdf') ||
    contentType.startsWith('application/zip') ||
    contentType.startsWith('font/')
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}
