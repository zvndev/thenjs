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

export function generateWorkerEntry(serverEntry: string, _workerDir: string): string {
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
      const outDir = join(dirname(serverEntry), '..');
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
