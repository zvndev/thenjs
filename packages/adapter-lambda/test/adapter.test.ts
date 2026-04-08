import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  lambdaAdapter,
  createLambdaHandler,
  eventToRequest,
  responseToResult,
} from '../src/index.js';
import type {
  APIGatewayProxyEventV2,
  LambdaContext,
} from '../src/index.js';
import type { RouteManifest, TaskManifest } from '@vura/build';

// ─── Helpers ───

function makeEvent(overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: 'GET /api/hello',
    rawPath: '/api/hello',
    rawQueryString: '',
    headers: {
      host: 'example.com',
      'content-type': 'application/json',
    },
    isBase64Encoded: false,
    requestContext: {
      accountId: '123456789012',
      apiId: 'abc123',
      domainName: 'example.com',
      domainPrefix: 'abc123',
      http: {
        method: 'GET',
        path: '/api/hello',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test-agent',
      },
      requestId: 'req-id-1',
      routeKey: 'GET /api/hello',
      stage: 'prod',
      time: '01/Jan/2024:00:00:00 +0000',
      timeEpoch: 1704067200000,
    },
    ...overrides,
  };
}

function makeLambdaContext(): LambdaContext {
  return {
    functionName: 'test-function',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
    memoryLimitInMB: '256',
    awsRequestId: 'test-req-id',
    logGroupName: '/aws/lambda/test',
    logStreamName: '2024/01/01/[$LATEST]abc123',
    getRemainingTimeInMillis: () => 30000,
  };
}

function makeRoutes(apiRoutes: RouteManifest['api']): RouteManifest {
  return { pages: [], api: apiRoutes, rpc: [] };
}

const emptyTasks: TaskManifest = { cron: [], queue: [] };

// ─── eventToRequest ───

describe('eventToRequest', () => {
  it('converts a simple GET event to a Request', () => {
    const event = makeEvent();
    const req = eventToRequest(event);

    expect(req.method).toBe('GET');
    expect(req.url).toBe('https://example.com/api/hello');
    expect(req.headers.get('content-type')).toBe('application/json');
    expect(req.headers.get('host')).toBe('example.com');
  });

  it('includes query string parameters', () => {
    const event = makeEvent({
      rawPath: '/api/users',
      rawQueryString: 'page=1&limit=10',
    });
    const req = eventToRequest(event);
    expect(req.url).toBe('https://example.com/api/users?page=1&limit=10');
  });

  it('handles POST with JSON body', async () => {
    const body = JSON.stringify({ name: 'Alice' });
    const event = makeEvent({
      routeKey: 'POST /api/users',
      rawPath: '/api/users',
      requestContext: {
        ...makeEvent().requestContext,
        http: { ...makeEvent().requestContext.http, method: 'POST', path: '/api/users' },
        routeKey: 'POST /api/users',
      },
      body,
      isBase64Encoded: false,
    });
    const req = eventToRequest(event);
    expect(req.method).toBe('POST');
    expect(await req.json()).toEqual({ name: 'Alice' });
  });

  it('handles base64-encoded body', async () => {
    const originalBody = 'Hello, binary world!';
    const event = makeEvent({
      requestContext: {
        ...makeEvent().requestContext,
        http: { ...makeEvent().requestContext.http, method: 'POST' },
      },
      body: btoa(originalBody),
      isBase64Encoded: true,
    });
    expect(await eventToRequest(event).text()).toBe(originalBody);
  });

  it('merges cookies into Cookie header', () => {
    const event = makeEvent({ cookies: ['session=abc123', 'theme=dark'] });
    expect(eventToRequest(event).headers.get('cookie')).toBe('session=abc123; theme=dark');
  });

  it('does not attach body to GET request', () => {
    const event = makeEvent({ body: 'ignored' });
    expect(eventToRequest(event).body).toBeNull();
  });
});

// ─── responseToResult ───

describe('responseToResult', () => {
  it('converts a JSON response', async () => {
    const response = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    const result = await responseToResult(response);
    expect(result.statusCode).toBe(200);
    expect(result.headers?.['content-type']).toBe('application/json');
    expect(result.body).toBe('{"ok":true}');
    expect(result.isBase64Encoded).toBe(false);
  });

  it('handles empty body (204 No Content)', async () => {
    const result = await responseToResult(new Response(null, { status: 204 }));
    expect(result.statusCode).toBe(204);
    expect(result.body).toBeUndefined();
  });

  it('extracts Set-Cookie into cookies array', async () => {
    const response = new Response('ok', {
      status: 200,
      headers: { 'set-cookie': 'session=abc; HttpOnly', 'content-type': 'text/plain' },
    });
    const result = await responseToResult(response);
    expect(result.cookies).toContain('session=abc; HttpOnly');
    expect(result.headers?.['set-cookie']).toBeUndefined();
  });

  it('base64-encodes binary responses', async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const response = new Response(bytes, {
      status: 200,
      headers: { 'content-type': 'image/png' },
    });
    const result = await responseToResult(response);
    expect(result.isBase64Encoded).toBe(true);
    expect(result.body).toBeTruthy();
  });
});

// ─── createLambdaHandler ───

describe('createLambdaHandler', () => {
  it('converts event through app.handle and returns result', async () => {
    const mockApp = {
      handle: vi.fn(async (request: Request) => {
        const url = new URL(request.url);
        return new Response(
          JSON.stringify({ path: url.pathname, method: request.method }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }),
    };

    const handler = createLambdaHandler(mockApp);
    const result = await handler(makeEvent(), makeLambdaContext());

    expect(result.statusCode).toBe(200);
    expect(mockApp.handle).toHaveBeenCalledTimes(1);
    expect(JSON.parse(result.body!).path).toBe('/api/hello');
  });
});

// ─── lambdaAdapter — SAM template generation ───

const writtenFiles = new Map<string, string>();

vi.mock('node:fs/promises', async () => {
  const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
  return {
    ...actual,
    writeFile: vi.fn(async (path: string, content: string) => {
      writtenFiles.set(path, content);
    }),
    mkdir: vi.fn(async () => undefined),
  };
});

describe('lambdaAdapter', () => {
  beforeEach(() => {
    writtenFiles.clear();
  });

  function makeBuildOptions(routes: RouteManifest) {
    return {
      serverEntry: '/project/dist/server/entry-server.js',
      clientDir: '/project/dist/client',
      staticDir: '/project/dist/static',
      routes,
      tasks: emptyTasks,
    };
  }

  it('generates SAM template with correct routes', async () => {
    const routes = makeRoutes([
      { path: '/api/hello', methods: ['GET'], handler: 'src/api/hello.ts' },
      { path: '/api/users', methods: ['GET', 'POST'], handler: 'src/api/users.ts' },
    ]);
    const adapter = lambdaAdapter({ region: 'us-west-2' });
    await adapter.buildEnd(makeBuildOptions(routes));

    const template = writtenFiles.get('/project/dist/template.yaml');
    expect(template).toBeDefined();
    expect(template).toContain('AWS::Serverless-2016-10-31');
    expect(template).toContain('/api/hello');
    expect(template).toContain('/api/users');
    expect(template).toContain('Method: GET');
    expect(template).toContain('Method: POST');
  });

  it('applies custom memory and timeout config', async () => {
    const routes = makeRoutes([{ path: '/api/hello', methods: ['GET'], handler: 'src/api/hello.ts' }]);
    const adapter = lambdaAdapter({ memory: 512, timeout: 15 });
    await adapter.buildEnd(makeBuildOptions(routes));

    const template = writtenFiles.get('/project/dist/template.yaml')!;
    expect(template).toContain('MemorySize: 512');
    expect(template).toContain('Timeout: 15');
  });

  it('uses default memory (256) and timeout (30)', async () => {
    const routes = makeRoutes([{ path: '/api/hello', methods: ['GET'], handler: 'src/api/hello.ts' }]);
    const adapter = lambdaAdapter();
    await adapter.buildEnd(makeBuildOptions(routes));

    const template = writtenFiles.get('/project/dist/template.yaml')!;
    expect(template).toContain('MemorySize: 256');
    expect(template).toContain('Timeout: 30');
  });

  it('generates samconfig.toml with stack name and region', async () => {
    const routes = makeRoutes([{ path: '/api/hello', methods: ['GET'], handler: 'src/api/hello.ts' }]);
    const adapter = lambdaAdapter({ region: 'eu-west-1', stackName: 'my-app' });
    await adapter.buildEnd(makeBuildOptions(routes));

    const samconfig = writtenFiles.get('/project/dist/samconfig.toml')!;
    expect(samconfig).toContain('stack_name = "my-app"');
    expect(samconfig).toContain('region = "eu-west-1"');
  });

  it('converts path params from :id to {id}', async () => {
    const routes = makeRoutes([{ path: '/api/users/:id', methods: ['GET'], handler: 'src/api/users/[id].ts' }]);
    const adapter = lambdaAdapter();
    await adapter.buildEnd(makeBuildOptions(routes));

    const template = writtenFiles.get('/project/dist/template.yaml')!;
    expect(template).toContain('/api/users/{id}');
    expect(template).not.toContain('/api/users/:id');
  });

  it('creates separate functions for multi-method routes', async () => {
    const routes = makeRoutes([{ path: '/api/items', methods: ['GET', 'POST', 'DELETE'], handler: 'src/api/items.ts' }]);
    const adapter = lambdaAdapter();
    await adapter.buildEnd(makeBuildOptions(routes));

    const template = writtenFiles.get('/project/dist/template.yaml')!;
    const functionCount = (template.match(/Type: AWS::Serverless::Function/g) || []).length;
    expect(functionCount).toBe(3);
  });

  it('generates handler files referencing @vura packages', async () => {
    const routes = makeRoutes([{ path: '/api/hello', methods: ['GET'], handler: 'src/api/hello.ts' }]);
    const adapter = lambdaAdapter();
    await adapter.buildEnd(makeBuildOptions(routes));

    const handlerPath = Array.from(writtenFiles.keys()).find(
      (k) => k.includes('lambda') && k.endsWith('index.js'),
    );
    expect(handlerPath).toBeDefined();

    const handlerCode = writtenFiles.get(handlerPath!)!;
    expect(handlerCode).toContain("from '@vura/server'");
    expect(handlerCode).toContain("from '@vura/adapter-lambda'");
    expect(handlerCode).toContain('export const handler = createLambdaHandler(app)');
  });

  it('has correct adapter name', () => {
    expect(lambdaAdapter().name).toBe('adapter-lambda');
  });
});
