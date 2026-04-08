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
