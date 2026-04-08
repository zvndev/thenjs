# Vura Rebrand + Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand `thenjs` to Vura, port Lambda + Cloudflare adapters from `then`, and archive the original `then` repo.

**Architecture:** Mechanical find-replace for the rebrand (no functional changes), then port two adapter packages by rewiring them from `@then/core`'s `AdapterBuildContext` to `@vura/build`'s `buildEnd` interface. The adapters' platform-specific logic (event conversion, SAM templates, wrangler.toml) stays intact.

**Tech Stack:** TypeScript, Vitest, pnpm workspaces, Vite

**Spec:** `docs/superpowers/specs/2026-04-08-vura-rebrand-consolidation-design.md`

---

### Task 1: Create Branch and Rename Directories

**Files:**
- Rename: `packages/thenjs/` → `packages/vura/`
- Rename: `packages/create-then/` → `packages/create-vura/`
- Rename: `vscode-extension/syntaxes/thenjs.tmLanguage.json` → `vscode-extension/syntaxes/vura.tmLanguage.json`
- Rename: `vscode-extension/snippets/thenjs.json` → `vscode-extension/snippets/vura.json`
- Rename: `examples/starter/then.config.ts` → `examples/starter/vura.config.ts`
- Rename: `examples/full-stack/then.config.ts` → `examples/full-stack/vura.config.ts`
- Modify: `pnpm-workspace.yaml` (no change needed — uses `packages/*` glob)
- Modify: `tsconfig.json` (update path reference)

- [ ] **Step 1: Create feature branch**

```bash
cd /Users/kmm/Projects/thenjs
git checkout main
git checkout -b refactor/vura-rebrand
```

- [ ] **Step 2: Rename package directories**

```bash
cd /Users/kmm/Projects/thenjs
mv packages/thenjs packages/vura
mv packages/create-then packages/create-vura
```

- [ ] **Step 3: Rename VS Code extension files**

```bash
cd /Users/kmm/Projects/thenjs
mv vscode-extension/syntaxes/thenjs.tmLanguage.json vscode-extension/syntaxes/vura.tmLanguage.json
mv vscode-extension/snippets/thenjs.json vscode-extension/snippets/vura.json
```

- [ ] **Step 4: Rename example config files**

```bash
cd /Users/kmm/Projects/thenjs
mv examples/starter/then.config.ts examples/starter/vura.config.ts
mv examples/full-stack/then.config.ts examples/full-stack/vura.config.ts
```

- [ ] **Step 5: Update tsconfig.json root path reference**

In `/Users/kmm/Projects/thenjs/tsconfig.json`, change the path reference from `packages/thenjs` to `packages/vura`.

- [ ] **Step 6: Commit structural renames**

```bash
git add -A
git commit -m "refactor: rename directories for Vura rebrand

Rename packages/thenjs → packages/vura, packages/create-then →
packages/create-vura, and config/extension files accordingly."
```

---

### Task 2: Global Package Name Replacements

Replace all package name strings across every file in the repo. These are mechanical find-replace operations.

**Files:** All `package.json`, all `.ts`, `.tsx`, `.js`, `.mjs`, `.json`, `.md`, `.yml`, `.yaml` files in the repo.

- [ ] **Step 1: Replace @thenjs/ scope with @vura/ in all files**

Find and replace `@thenjs/` → `@vura/` across all files in the repo. This covers:
- Import statements: `from '@thenjs/server'` → `from '@vura/server'`
- Package.json dependency declarations
- README install instructions
- VS Code extension regex patterns
- Generated code strings in scaffolder and adapters

Use a global find-replace across all file types: `.ts`, `.tsx`, `.js`, `.mjs`, `.json`, `.md`, `.yml`, `.yaml`, `.toml`.

- [ ] **Step 2: Replace standalone "thenjs" package references**

Replace these specific patterns (be careful not to catch partial matches):
- In package.json `"name"` fields: `"thenjs-monorepo"` → `"vura"`, `"thenjs"` → `"vura"`
- In package.json `"dependencies"`: `"thenjs": "^0.1.0"` → `"vura": "^0.1.0"` and `"thenjs": "*"` → `"vura": "*"`
- In package.json `"scripts"`: `"thenjs dev"` → `"vura dev"`, `"thenjs build"` → `"vura build"`, `"thenjs preview"` → `"vura preview"`
- In package.json `"bin"`: `"thenjs"` → `"vura"`
- In import statements: `from 'thenjs'` → `from 'vura'`
- In VS Code snippet bodies and grammar patterns: match strings referencing `thenjs`

- [ ] **Step 3: Replace "create-then" with "create-vura"**

Find and replace `create-then` → `create-vura` across all files. This covers:
- `packages/create-vura/package.json` name and bin fields
- README usage examples
- Issue template dropdowns
- Changeset config

- [ ] **Step 4: Replace display name "ThenJS" with "Vura"**

Find and replace `ThenJS` → `Vura` across all `.md`, `.ts`, `.tsx`, `.json`, `.yml`, `.yaml`, `.mjs` files. This covers:
- README headings and descriptions
- VS Code extension displayName and description
- CONTRIBUTING.md
- Docs site config (astro.config.mjs title)
- Issue templates
- Comment strings in source code
- CLI ASCII art banner
- Scaffolder welcome messages
- SAM template description

- [ ] **Step 5: Replace thenjs-specific name variants**

Additional targeted replacements:
- `thenjs-monorepo` → `vura` (root package.json)
- `thenjs-starter` → `vura-starter` (examples/starter/package.json)
- `thenjs-full-stack` → `vura-full-stack` (examples/full-stack/package.json)
- `thenjs-docs` → `vura-docs` (docs-site/package.json)
- `thenjs.dev` → `vura.dev` (docs-site/astro.config.mjs)
- `zvndev/thenjs` → `zvndev/vura` (all GitHub URLs in READMEs, extension, CONTRIBUTING.md)

- [ ] **Step 6: Replace log prefix strings**

Find and replace these log/comment prefixes:
- `[thenjs]` → `[vura]` (in build.ts, cli.ts, adapter-node, adapter-vercel, vite-plugin)
- `[thenjs:vercel]` → `[vura:vercel]` (adapter-vercel)
- `[thenjs:adapter-node]` → `[vura:adapter-node]` (adapter-node)
- `// @thenjs/` → `// @vura/` (file header comments)

- [ ] **Step 7: Update VS Code extension identifiers**

In `vscode-extension/package.json`:
- `"name": "thenjs"` → `"name": "vura"`
- `"scopeName": "thenjs.injection"` → `"scopeName": "vura.injection"`
- `"path": "./syntaxes/thenjs.tmLanguage.json"` → `"./syntaxes/vura.tmLanguage.json"`
- `"path": "./snippets/thenjs.json"` → `"./snippets/vura.json"`

In `vscode-extension/syntaxes/vura.tmLanguage.json`:
- `"scopeName": "thenjs.injection"` → `"scopeName": "vura.injection"`
- Regex pattern: `(@thenjs/[a-zA-Z-]+|thenjs)` → `(@vura/[a-zA-Z-]+|vura)`

In `vscode-extension/snippets/vura.json`:
- All `"prefix": "then-*"` → `"prefix": "vura-*"` (then-config → vura-config, then-page → vura-page, then-api → vura-api, then-rpc → vura-rpc, then-router → vura-router, then-middleware → vura-middleware, then-client → vura-client, then-hook → vura-hook)
- All snippet display names: `"ThenJS Config"` → `"Vura Config"`, etc.

- [ ] **Step 8: Update changeset config**

In `.changeset/config.json`, update the linked packages array:
```json
["@vura/server", "@vura/rpc", "@vura/schema", "@vura/build", "vura"]
```

- [ ] **Step 9: Update GitHub issue templates**

In `.github/ISSUE_TEMPLATE/bug_report.yml` and `feature_request.yml`:
- Description: `ThenJS` → `Vura`
- Package dropdown options: all `@thenjs/*` → `@vura/*`, `create-then` → `create-vura`

- [ ] **Step 10: Commit package name replacements**

```bash
git add -A
git commit -m "refactor: rename all package references from thenjs to vura

Global find-replace of @thenjs/* → @vura/*, thenjs → vura,
create-then → create-vura, and ThenJS → Vura across all files."
```

---

### Task 3: Rename Types and Function Names

Rename all exported TypeScript types and functions that contain "Then" to use "Vura".

**Files:**
- Modify: `packages/server/src/config.ts`
- Modify: `packages/server/src/types.ts`
- Modify: `packages/server/src/app.ts`
- Modify: `packages/server/src/index.ts`
- Modify: `packages/build/src/vite-plugin.ts`
- Modify: `packages/build/src/build.ts`
- Modify: `packages/build/src/index.ts`
- Modify: `packages/adapter-node/src/index.ts`
- Modify: `packages/adapter-vercel/src/index.ts`
- Modify: All test files that reference these types
- Modify: All files that import these types

- [ ] **Step 1: Rename types globally**

Find and replace across all `.ts`, `.tsx` files:
- `ThenConfig` → `VuraConfig` (defined in server/src/config.ts, used everywhere)
- `ThenApp` → `VuraApp` (defined in server/src/types.ts or app.ts, used in adapters)
- `ThenRequest` → `VuraRequest` (defined in server/src/types.ts)
- `ThenReply` → `VuraReply` (defined in server/src/types.ts)
- `ThenAdapter` → `VuraAdapter` (defined in adapter-node and adapter-vercel)
- `ThenVitePluginOptions` → `VuraVitePluginOptions` (defined in build/src/vite-plugin.ts)

- [ ] **Step 2: Rename functions**

Find and replace across all `.ts`, `.tsx` files:
- `thenVitePlugin` → `vuraVitePlugin` (defined in build/src/vite-plugin.ts, used in build.ts and cli.ts)

- [ ] **Step 3: Rename virtual module IDs**

In `packages/build/src/vite-plugin.ts`:
- `'virtual:then-routes'` → `'virtual:vura-routes'`
- `'virtual:then-manifest'` → `'virtual:vura-manifest'`
- `'virtual:then-rpc-client'` → `'virtual:vura-rpc-client'`
- Comment: `// Auto-generated by @thenjs/build` → `// Auto-generated by @vura/build`

- [ ] **Step 4: Rename Vite plugin name**

In `packages/build/src/vite-plugin.ts`:
- `name: 'thenjs'` → `name: 'vura'`

- [ ] **Step 5: Update config file scanning**

In `packages/server/src/config.ts`, update the config file names array:
```typescript
const configFiles = ['vura.config.ts', 'vura.config.js', 'vura.config.mjs'];
```
And the comment above it.

- [ ] **Step 6: Update CLI banner and text**

In `packages/vura/src/cli.ts`:
- Version string: `'thenjs v0.1.0'` → `'vura v0.1.0'`
- ASCII art banner: replace `T H E N J S` with `V U R A`
- Help text: `Usage: thenjs` → `Usage: vura`
- All `[thenjs]` log prefixes → `[vura]`

- [ ] **Step 7: Update scaffolder generated content**

In `packages/create-vura/src/index.ts`:
- Help text: `Usage: create-then` → `Usage: create-vura`
- `npx create-then` → `npx create-vura`
- `'my-then-app'` → `'my-vura-app'`
- `Creating ThenJS project:` → `Creating Vura project:`
- `npx thenjs dev` → `npx vura dev`
- Generated package.json scripts: `'thenjs dev'` → `'vura dev'`, etc.
- Generated package.json deps: `'thenjs': '^0.1.0'` → `'vura': '^0.1.0'`
- Generated config filename: `'then.config.ts'` → `'vura.config.ts'`
- Generated config import: `from 'thenjs'` → `from 'vura'`
- Generated HTML: `Welcome to ThenJS` → `Welcome to Vura`, `ThenJS App` → `Vura App`
- Full-stack template: `from '@thenjs/rpc'` → `from '@vura/rpc'`, `from '@thenjs/server'` → `from '@vura/server'`
- Full-stack deps: `'@thenjs/rpc'` → `'@vura/rpc'`

- [ ] **Step 8: Update build adapter resolution**

In `packages/build/src/build.ts`:
- `'@thenjs/adapter-node'` → `'@vura/adapter-node'`
- `'@thenjs/adapter-vercel'` → `'@vura/adapter-vercel'`
- `'@thenjs/adapter-netlify'` → `'@vura/adapter-netlify'`
- `'@thenjs/adapter-cloudflare'` → `'@vura/adapter-cloudflare'`

- [ ] **Step 9: Commit type and function renames**

```bash
git add -A
git commit -m "refactor: rename Then* types to Vura* and update all references

ThenConfig → VuraConfig, ThenApp → VuraApp, ThenRequest → VuraRequest,
ThenReply → VuraReply, ThenAdapter → VuraAdapter, thenVitePlugin → vuraVitePlugin.
Update virtual module IDs, config file scanning, CLI text, and scaffolder."
```

---

### Task 4: Verify Rebrand — Build and Test

**Files:** None (verification only)

- [ ] **Step 1: Install dependencies**

```bash
cd /Users/kmm/Projects/thenjs
pnpm install
```

- [ ] **Step 2: Run TypeScript build**

```bash
cd /Users/kmm/Projects/thenjs
pnpm run build
```

Expected: Clean compilation with no errors. If there are errors, they indicate missed renames — fix them.

- [ ] **Step 3: Run test suite**

```bash
cd /Users/kmm/Projects/thenjs
pnpm run test
```

Expected: All existing tests pass. If any fail due to string assertions referencing old names, update those assertions.

- [ ] **Step 4: Grep for leftover references**

```bash
cd /Users/kmm/Projects/thenjs
grep -r "thenjs\|@thenjs\|ThenJS\|ThenConfig\|ThenApp\|ThenRequest\|ThenReply\|ThenAdapter\|ThenVitePlugin\|thenVitePlugin\|then\.config\|then-config\|then-page\|then-api\|then-rpc\|create-then" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" --include="*.yml" --include="*.yaml" --include="*.mjs" . | grep -v node_modules | grep -v dist | grep -v pnpm-lock | grep -v ".git/"
```

Expected: No matches. Any remaining references are bugs — fix them.

- [ ] **Step 5: Commit any fixes from verification**

If any fixes were needed:
```bash
git add -A
git commit -m "fix: resolve remaining thenjs references found during verification"
```

---

### Task 5: Create @vura/adapter-lambda Package

Port the Lambda adapter from `/Users/kmm/Projects/then/packages/adapter-lambda/` and rewire it to use `@vura/build`'s adapter interface instead of `@then/core`.

**Key interface change:**
- Old: `buildEnd(ctx: AdapterBuildContext)` where `ctx.manifest.api[].urlPattern`, `ctx.manifest.api[].filePath`, `ctx.manifest.api[].kind`, `ctx.outDir`
- New: `buildEnd({ serverEntry, clientDir, staticDir, routes, tasks })` where `routes.api[].path`, `routes.api[].methods`, `routes.api[].handler`
- No `kind` filtering (thenjs routes don't have kinds — process all API routes)
- No `outDir` directly — derive from `serverEntry` path
- Generated handler code references `@vura/server` and `@vura/adapter-lambda` instead of `@celsian/core` and `@then/adapter-lambda`

**Files:**
- Create: `packages/adapter-lambda/package.json`
- Create: `packages/adapter-lambda/tsconfig.json`
- Create: `packages/adapter-lambda/src/index.ts`
- Create: `packages/adapter-lambda/test/adapter.test.ts`

- [ ] **Step 1: Create package directory and config**

```bash
mkdir -p /Users/kmm/Projects/thenjs/packages/adapter-lambda/src
mkdir -p /Users/kmm/Projects/thenjs/packages/adapter-lambda/test
```

Write `packages/adapter-lambda/package.json`:
```json
{
  "name": "@vura/adapter-lambda",
  "version": "0.1.0",
  "type": "module",
  "license": "MIT",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run"
  },
  "peerDependencies": {
    "@vura/server": "*",
    "@vura/build": "*"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

Write `packages/adapter-lambda/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 2: Write the adapter source**

Write `packages/adapter-lambda/src/index.ts`. This is the ported version of the Lambda adapter, rewired from `@then/core` to `@vura/build`.

The file keeps all platform-specific code intact (eventToRequest, responseToResult, createLambdaHandler, SAM template generation, samconfig generation) and rewires:
- Types: import `RouteManifest`, `TaskManifest` from `@vura/build` instead of `@then/core`
- Interface: implement `VuraAdapter` with `buildEnd({ serverEntry, clientDir, staticDir, routes, tasks })`
- Route access: `routes.api` instead of `manifest.api`, `route.path` instead of `route.urlPattern`, `route.handler` instead of `route.filePath`
- No `kind` filtering — process all API routes
- Derive `outDir` from `serverEntry`: `join(dirname(dirname(serverEntry)))` since serverEntry is `dist/server/entry-server.js`
- Generated handler code: import from `@vura/server` and `@vura/adapter-lambda` instead of `@celsian/core` and `@then/adapter-lambda`

```typescript
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
      const outDir = join(dirname(dirname(serverEntry)));
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
```

- [ ] **Step 3: Write the test file**

Write `packages/adapter-lambda/test/adapter.test.ts`. Ported from `then` with interface updated to match `@vura/build`:

```typescript
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
  return {
    pages: [],
    api: apiRoutes,
    rpc: [],
  };
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
    const parsed = await req.json();
    expect(parsed).toEqual({ name: 'Alice' });
  });

  it('handles base64-encoded body', async () => {
    const originalBody = 'Hello, binary world!';
    const base64Body = btoa(originalBody);
    const event = makeEvent({
      requestContext: {
        ...makeEvent().requestContext,
        http: { ...makeEvent().requestContext.http, method: 'POST' },
      },
      body: base64Body,
      isBase64Encoded: true,
    });
    const req = eventToRequest(event);
    expect(await req.text()).toBe(originalBody);
  });

  it('merges cookies into Cookie header', () => {
    const event = makeEvent({ cookies: ['session=abc123', 'theme=dark'] });
    const req = eventToRequest(event);
    expect(req.headers.get('cookie')).toBe('session=abc123; theme=dark');
  });

  it('does not attach body to GET request', () => {
    const event = makeEvent({ body: 'ignored' });
    const req = eventToRequest(event);
    expect(req.body).toBeNull();
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
    const response = new Response(null, { status: 204 });
    const result = await responseToResult(response);
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
    const body = JSON.parse(result.body!);
    expect(body.path).toBe('/api/hello');
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
    const adapter = lambdaAdapter();
    expect(adapter.name).toBe('adapter-lambda');
  });
});
```

- [ ] **Step 4: Run the tests**

```bash
cd /Users/kmm/Projects/thenjs
pnpm --filter @vura/adapter-lambda test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/adapter-lambda
git commit -m "feat: add @vura/adapter-lambda — AWS Lambda + API Gateway adapter

Ported from @then/adapter-lambda, rewired to use @vura/build adapter
interface. Generates SAM templates, per-function handlers, and samconfig.
Includes event/response conversion and createLambdaHandler runtime wrapper."
```

---

### Task 6: Create @vura/adapter-cloudflare Package

Port the Cloudflare adapter from `/Users/kmm/Projects/then/packages/adapter-cloudflare/` with same interface rewiring as the Lambda adapter.

**Files:**
- Create: `packages/adapter-cloudflare/package.json`
- Create: `packages/adapter-cloudflare/tsconfig.json`
- Create: `packages/adapter-cloudflare/src/index.ts`
- Create: `packages/adapter-cloudflare/test/adapter.test.ts`

- [ ] **Step 1: Create package directory and config**

```bash
mkdir -p /Users/kmm/Projects/thenjs/packages/adapter-cloudflare/src
mkdir -p /Users/kmm/Projects/thenjs/packages/adapter-cloudflare/test
```

Write `packages/adapter-cloudflare/package.json`:
```json
{
  "name": "@vura/adapter-cloudflare",
  "version": "0.1.0",
  "type": "module",
  "license": "MIT",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run"
  },
  "peerDependencies": {
    "@vura/server": "*",
    "@vura/build": "*"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

Write `packages/adapter-cloudflare/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 2: Write the adapter source**

Write `packages/adapter-cloudflare/src/index.ts`. Ported from `then`, rewired to `@vura/build` interface:

```typescript
/**
 * @vura/adapter-cloudflare
 *
 * Adapts Vura build output for Cloudflare Workers deployment.
 * Cloudflare Workers natively use Web Standard Request/Response,
 * so this adapter mainly generates wrangler.toml and worker entry files.
 * Supports KV, D1, and R2 bindings.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import type { RouteManifest, TaskManifest } from '@vura/build';

// ─── Types ───

export interface KVBinding {
  binding: string;
  id: string;
  preview_id?: string;
}

export interface D1Binding {
  binding: string;
  database_name: string;
  database_id: string;
}

export interface R2Binding {
  binding: string;
  bucket_name: string;
}

export interface WorkerRoute {
  pattern: string;
  zone_name?: string;
}

export interface CloudflareAdapterOptions {
  name: string;
  compatibilityDate?: string;
  routes?: WorkerRoute[];
  kv?: KVBinding[];
  d1?: D1Binding[];
  r2?: R2Binding[];
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

export interface CloudflareRequest extends Request {
  __cf_env: Record<string, unknown>;
  __cf_ctx: ExecutionContext;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

export interface CloudflareWorkerHandler {
  fetch(
    request: Request,
    env: Record<string, unknown>,
    ctx: ExecutionContext,
  ): Promise<Response>;
}

// ─── Wrangler TOML Generator ───

export function generateWranglerToml(
  options: CloudflareAdapterOptions,
  _routes: RouteManifest['api'],
): string {
  const lines: string[] = [];

  lines.push(`name = "${options.name}"`);
  lines.push(`main = "entry.js"`);
  lines.push(
    `compatibility_date = "${options.compatibilityDate ?? toDateString(new Date())}"`,
  );
  lines.push('');

  if (options.routes && options.routes.length > 0) {
    lines.push('# Routes');
    for (const route of options.routes) {
      lines.push('[[routes]]');
      lines.push(`pattern = "${route.pattern}"`);
      if (route.zone_name) {
        lines.push(`zone_name = "${route.zone_name}"`);
      }
      lines.push('');
    }
  }

  if (options.kv && options.kv.length > 0) {
    lines.push('# KV Namespaces');
    for (const kv of options.kv) {
      lines.push('[[kv_namespaces]]');
      lines.push(`binding = "${kv.binding}"`);
      lines.push(`id = "${kv.id}"`);
      if (kv.preview_id) {
        lines.push(`preview_id = "${kv.preview_id}"`);
      }
      lines.push('');
    }
  }

  if (options.d1 && options.d1.length > 0) {
    lines.push('# D1 Databases');
    for (const d1 of options.d1) {
      lines.push('[[d1_databases]]');
      lines.push(`binding = "${d1.binding}"`);
      lines.push(`database_name = "${d1.database_name}"`);
      lines.push(`database_id = "${d1.database_id}"`);
      lines.push('');
    }
  }

  if (options.r2 && options.r2.length > 0) {
    lines.push('# R2 Buckets');
    for (const r2 of options.r2) {
      lines.push('[[r2_buckets]]');
      lines.push(`binding = "${r2.binding}"`);
      lines.push(`bucket_name = "${r2.bucket_name}"`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

// ─── Worker Entry Generator ───

export function generateWorkerEntry(serverEntry: string, workerDir: string): string {
  // Use the built server entry directly instead of per-route registration
  const relPath = serverEntry.startsWith('.')
    ? serverEntry
    : `./${serverEntry}`;

  return `import app from '${relPath}';

// Cloudflare Worker fetch handler
// Vura uses Web Standard Request/Response — nearly a pass-through.
export default {
  async fetch(request, env, ctx) {
    request.__cf_env = env;
    request.__cf_ctx = ctx;
    return app.handle(request);
  },
};
`;
}

// ─── Worker Handler Wrapper ───

export function createWorkerHandler(app: {
  handle(request: Request): Promise<Response> | Response;
}): CloudflareWorkerHandler {
  return {
    async fetch(
      request: Request,
      env: Record<string, unknown>,
      ctx: ExecutionContext,
    ): Promise<Response> {
      (request as CloudflareRequest).__cf_env = env;
      (request as CloudflareRequest).__cf_ctx = ctx;
      return app.handle(request);
    },
  };
}

// ─── Adapter Factory ───

export function cloudflareAdapter(options: CloudflareAdapterOptions): VuraAdapter {
  return {
    name: 'cloudflare',
    entryTemplate: 'cloudflare-worker',

    async buildEnd({ serverEntry, routes }) {
      const outDir = join(dirname(dirname(serverEntry)));
      const workerDir = join(outDir, 'cloudflare');
      await mkdir(workerDir, { recursive: true });

      const toml = generateWranglerToml(options, routes.api);
      await writeFile(join(workerDir, 'wrangler.toml'), toml);

      const entry = generateWorkerEntry(serverEntry, workerDir);
      await writeFile(join(workerDir, 'entry.js'), entry);
    },
  };
}

// ─── Helpers ───

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0]!;
}
```

- [ ] **Step 3: Write the test file**

Write `packages/adapter-cloudflare/test/adapter.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateWranglerToml,
  generateWorkerEntry,
  createWorkerHandler,
  cloudflareAdapter,
} from '../src/index.js';
import type { RouteManifest, TaskManifest } from '@vura/build';

vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(async () => {}),
  mkdir: vi.fn(async () => undefined),
}));

function makeRoutes(api: RouteManifest['api'] = []): RouteManifest {
  return { pages: [], api, rpc: [] };
}

const emptyTasks: TaskManifest = { cron: [], queue: [] };

// ─── wrangler.toml Generation ───

describe('generateWranglerToml', () => {
  it('generates basic worker config', () => {
    const toml = generateWranglerToml(
      { name: 'my-api', compatibilityDate: '2024-12-01' },
      [],
    );
    expect(toml).toContain('name = "my-api"');
    expect(toml).toContain('main = "entry.js"');
    expect(toml).toContain('compatibility_date = "2024-12-01"');
  });

  it('includes route patterns when provided', () => {
    const toml = generateWranglerToml(
      {
        name: 'my-api',
        compatibilityDate: '2024-12-01',
        routes: [{ pattern: 'example.com/api/*', zone_name: 'example.com' }],
      },
      [],
    );
    expect(toml).toContain('[[routes]]');
    expect(toml).toContain('pattern = "example.com/api/*"');
    expect(toml).toContain('zone_name = "example.com"');
  });

  it('includes KV namespace bindings', () => {
    const toml = generateWranglerToml(
      {
        name: 'my-api',
        compatibilityDate: '2024-12-01',
        kv: [{ binding: 'CACHE', id: 'abc123', preview_id: 'dev456' }],
      },
      [],
    );
    expect(toml).toContain('binding = "CACHE"');
    expect(toml).toContain('id = "abc123"');
    expect(toml).toContain('preview_id = "dev456"');
  });

  it('includes D1 database bindings', () => {
    const toml = generateWranglerToml(
      {
        name: 'my-api',
        compatibilityDate: '2024-12-01',
        d1: [{ binding: 'DB', database_name: 'my-db', database_id: 'db-id-123' }],
      },
      [],
    );
    expect(toml).toContain('binding = "DB"');
    expect(toml).toContain('database_name = "my-db"');
    expect(toml).toContain('database_id = "db-id-123"');
  });

  it('includes R2 bucket bindings', () => {
    const toml = generateWranglerToml(
      {
        name: 'my-api',
        compatibilityDate: '2024-12-01',
        r2: [{ binding: 'UPLOADS', bucket_name: 'my-uploads' }],
      },
      [],
    );
    expect(toml).toContain('binding = "UPLOADS"');
    expect(toml).toContain('bucket_name = "my-uploads"');
  });

  it('defaults compatibility_date to today when not specified', () => {
    const toml = generateWranglerToml({ name: 'test' }, []);
    expect(toml).toMatch(/compatibility_date = "\d{4}-\d{2}-\d{2}"/);
  });
});

// ─── Worker Entry Generation ───

describe('generateWorkerEntry', () => {
  it('generates a worker that imports the server entry', () => {
    const entry = generateWorkerEntry(
      '/project/dist/server/entry-server.js',
      '/project/dist/cloudflare',
    );
    expect(entry).toContain('import app from');
    expect(entry).toContain('export default');
    expect(entry).toContain('async fetch(request, env, ctx)');
    expect(entry).toContain('app.handle(request)');
  });

  it('attaches env and ctx bindings to request', () => {
    const entry = generateWorkerEntry(
      '/project/dist/server/entry-server.js',
      '/project/dist/cloudflare',
    );
    expect(entry).toContain('request.__cf_env = env');
    expect(entry).toContain('request.__cf_ctx = ctx');
  });
});

// ─── createWorkerHandler ───

describe('createWorkerHandler', () => {
  it('wraps an app as a CF Worker handler', () => {
    const handler = createWorkerHandler({
      handle: async () => new Response('ok'),
    });
    expect(handler).toHaveProperty('fetch');
    expect(typeof handler.fetch).toBe('function');
  });

  it('passes request through to app.handle()', async () => {
    let capturedRequest: Request | null = null;
    const handler = createWorkerHandler({
      handle: async (req: Request) => {
        capturedRequest = req;
        return new Response('ok');
      },
    });

    const request = new Request('https://example.com/api/hello');
    const env = { MY_KV: 'kv-binding' };
    const ctx = { waitUntil: () => {}, passThroughOnException: () => {} };

    await handler.fetch(request, env, ctx);
    expect(capturedRequest).toBe(request);
  });

  it('decorates request with env and ctx', async () => {
    let capturedRequest: Request | null = null;
    const handler = createWorkerHandler({
      handle: async (req: Request) => {
        capturedRequest = req;
        return new Response('ok');
      },
    });

    const env = { DB: 'db-binding' };
    const ctx = { waitUntil: () => {}, passThroughOnException: () => {} };
    await handler.fetch(new Request('https://example.com/'), env, ctx);

    expect((capturedRequest as any).__cf_env).toBe(env);
    expect((capturedRequest as any).__cf_ctx).toBe(ctx);
  });
});

// ─── Adapter Integration ───

describe('cloudflareAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an adapter with name "cloudflare"', () => {
    const adapter = cloudflareAdapter({ name: 'my-api' });
    expect(adapter.name).toBe('cloudflare');
    expect(typeof adapter.buildEnd).toBe('function');
  });

  it('generates files in the correct output directory', async () => {
    const adapter = cloudflareAdapter({
      name: 'my-api',
      compatibilityDate: '2024-12-01',
    });

    await adapter.buildEnd({
      serverEntry: '/project/dist/server/entry-server.js',
      clientDir: '/project/dist/client',
      staticDir: '/project/dist/static',
      routes: makeRoutes([{ path: '/api/hello', methods: ['GET'], handler: 'src/api/hello.ts' }]),
      tasks: emptyTasks,
    });

    const { writeFile } = await import('node:fs/promises');
    const writeCalls = vi.mocked(writeFile).mock.calls;
    const paths = writeCalls.map(([path]) => path as string);

    expect(paths).toContain('/project/dist/cloudflare/wrangler.toml');
    expect(paths).toContain('/project/dist/cloudflare/entry.js');
  });

  it('generates bindings in wrangler.toml', async () => {
    const adapter = cloudflareAdapter({
      name: 'my-api',
      compatibilityDate: '2024-12-01',
      kv: [{ binding: 'CACHE', id: 'kv-123' }],
      d1: [{ binding: 'DB', database_name: 'mydb', database_id: 'db-456' }],
    });

    await adapter.buildEnd({
      serverEntry: '/project/dist/server/entry-server.js',
      clientDir: '/project/dist/client',
      staticDir: '/project/dist/static',
      routes: makeRoutes([]),
      tasks: emptyTasks,
    });

    const { writeFile } = await import('node:fs/promises');
    const tomlCall = vi.mocked(writeFile).mock.calls.find(
      ([path]) => (path as string).endsWith('wrangler.toml'),
    );
    expect(tomlCall).toBeDefined();

    const toml = tomlCall![1] as string;
    expect(toml).toContain('binding = "CACHE"');
    expect(toml).toContain('binding = "DB"');
  });
});
```

- [ ] **Step 4: Run the tests**

```bash
cd /Users/kmm/Projects/thenjs
pnpm --filter @vura/adapter-cloudflare test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/adapter-cloudflare
git commit -m "feat: add @vura/adapter-cloudflare — Cloudflare Workers adapter

Ported from @then/adapter-cloudflare, rewired to use @vura/build adapter
interface. Generates wrangler.toml with KV/D1/R2 bindings and worker entry.
Includes createWorkerHandler runtime wrapper."
```

---

### Task 7: Wire New Adapters into Build System

Update the build auto-detection and adapter resolution to include Lambda and Cloudflare.

**Files:**
- Modify: `packages/build/src/build.ts`
- Modify: `packages/server/src/config.ts` (add 'lambda' and 'cloudflare' to adapter union)

- [ ] **Step 1: Update adapter type in config**

In `packages/server/src/config.ts`, update the `build.adapter` type to include the new options:

```typescript
adapter?: 'auto' | 'node' | 'vercel' | 'lambda' | 'cloudflare' | string;
```

- [ ] **Step 2: Update adapter resolution in build.ts**

In `packages/build/src/build.ts`, update `resolveAdapter`:

```typescript
function resolveAdapter(adapter: string): string {
  if (adapter === 'auto') return detectAdapter();
  if (adapter === 'node') return '@vura/adapter-node';
  if (adapter === 'vercel') return '@vura/adapter-vercel';
  if (adapter === 'lambda') return '@vura/adapter-lambda';
  if (adapter === 'cloudflare') return '@vura/adapter-cloudflare';
  return adapter;
}
```

Update `detectAdapter` to include Lambda:

```typescript
function detectAdapter(): string {
  if (process.env.VERCEL) return '@vura/adapter-vercel';
  if (process.env.NETLIFY) return '@vura/adapter-netlify';
  if (process.env.CF_PAGES) return '@vura/adapter-cloudflare';
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return '@vura/adapter-lambda';
  return '@vura/adapter-node';
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/build/src/build.ts packages/server/src/config.ts
git commit -m "feat: wire Lambda and Cloudflare adapters into build auto-detection

Add 'lambda' and 'cloudflare' as named adapter options in VuraConfig.
Auto-detect Lambda via AWS_LAMBDA_FUNCTION_NAME env var."
```

---

### Task 8: Final Verification and Lockfile

**Files:** None (verification + lockfile regeneration)

- [ ] **Step 1: Regenerate lockfile**

```bash
cd /Users/kmm/Projects/thenjs
pnpm install
```

- [ ] **Step 2: Full TypeScript build**

```bash
cd /Users/kmm/Projects/thenjs
pnpm run build
```

Expected: Clean build across all packages including the two new adapters.

- [ ] **Step 3: Run full test suite**

```bash
cd /Users/kmm/Projects/thenjs
pnpm run test
```

Expected: All tests pass across all packages.

- [ ] **Step 4: Final grep for stale references**

```bash
cd /Users/kmm/Projects/thenjs
grep -rn "thenjs\|@thenjs\|ThenJS\|@then/\|ThenConfig\|ThenApp\|ThenRequest\|ThenReply\|ThenAdapter\|ThenVitePlugin\|thenVitePlugin\|then\.config\|create-then" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" --include="*.yml" --include="*.yaml" --include="*.mjs" . | grep -v node_modules | grep -v dist | grep -v pnpm-lock | grep -v ".git/" | grep -v "superpowers/specs" | grep -v "superpowers/plans"
```

Expected: No matches outside of spec/plan docs.

- [ ] **Step 5: Commit lockfile**

```bash
git add pnpm-lock.yaml
git commit -m "chore: regenerate lockfile after Vura rebrand"
```

- [ ] **Step 6: Push branch**

```bash
git push -u origin refactor/vura-rebrand
```
