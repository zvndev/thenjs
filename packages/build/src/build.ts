// @thenjs/build — Production build pipeline

import type { ThenConfig } from '@thenjs/server';

export interface BuildOptions {
  config: ThenConfig;
  root: string;
}

export interface BuildResult {
  clientDir: string;
  serverEntry: string;
  staticDir: string;
  routes: RouteManifest;
  tasks: TaskManifest;
}

export interface RouteManifest {
  pages: Array<{
    path: string;
    mode: 'client' | 'server' | 'static' | 'hybrid';
    component: string;
    layout?: string;
  }>;
  api: Array<{
    path: string;
    methods: string[];
    handler: string;
  }>;
  rpc: Array<{
    path: string;
    type: 'query' | 'mutation';
  }>;
}

export interface TaskManifest {
  cron: Array<{
    name: string;
    schedule: string;
    handler: string;
  }>;
  queue: Array<{
    name: string;
    concurrency: number;
    handler: string;
  }>;
}

export async function build(options: BuildOptions): Promise<BuildResult> {
  const { config, root } = options;
  const outDir = config.build?.outDir ?? 'dist';

  // 1. Resolve adapter
  const adapterName = resolveAdapter(config.build?.adapter ?? 'auto');

  console.log(`[thenjs] Building for ${adapterName}...`);
  console.log(`[thenjs] Root: ${root}`);
  console.log(`[thenjs] Output: ${outDir}`);

  // 2. Run Vite builds (client + server)
  const { build: viteBuild } = await import('vite');
  const { thenVitePlugin } = await import('./vite-plugin.js');

  // Client build
  console.log('[thenjs] Building client...');
  await viteBuild({
    root,
    plugins: thenVitePlugin({ config }),
    build: {
      outDir: `${outDir}/client`,
      manifest: true,
      rollupOptions: {
        input: findClientEntries(root),
      },
    },
  });

  // Server build
  console.log('[thenjs] Building server...');
  await viteBuild({
    root,
    plugins: thenVitePlugin({ config }),
    build: {
      outDir: `${outDir}/server`,
      ssr: true,
      rollupOptions: {
        input: `${root}/src/entry-server.tsx`,
        output: {
          format: 'esm',
        },
      },
    },
  });

  // 3. Static pre-rendering for static/hybrid pages
  console.log('[thenjs] Pre-rendering static pages...');
  const staticPages = await prerenderStaticPages(root, outDir);

  // 4. Build route manifest
  const routes = await buildRouteManifest(root);
  const tasks = await buildTaskManifest(root);

  // 5. Run adapter transform
  console.log(`[thenjs] Running ${adapterName} adapter...`);
  const adapter = await loadAdapter(adapterName);
  await adapter.buildEnd({
    serverEntry: `${outDir}/server/entry-server.js`,
    clientDir: `${outDir}/client`,
    staticDir: `${outDir}/static`,
    routes,
    tasks,
  });

  console.log('[thenjs] Build complete!');

  return {
    clientDir: `${outDir}/client`,
    serverEntry: `${outDir}/server/entry-server.js`,
    staticDir: `${outDir}/static`,
    routes,
    tasks,
  };
}

// ─── Helpers ───

function resolveAdapter(adapter: string): string {
  if (adapter === 'auto') {
    return detectAdapter();
  }
  if (adapter === 'node') return '@thenjs/adapter-node';
  if (adapter === 'vercel') return '@thenjs/adapter-vercel';
  return adapter;
}

function detectAdapter(): string {
  if (process.env.VERCEL) return '@thenjs/adapter-vercel';
  if (process.env.NETLIFY) return '@thenjs/adapter-netlify';
  if (process.env.CF_PAGES) return '@thenjs/adapter-cloudflare';
  return '@thenjs/adapter-node';
}

async function loadAdapter(name: string): Promise<{
  buildEnd(options: {
    serverEntry: string;
    clientDir: string;
    staticDir: string;
    routes: RouteManifest;
    tasks: TaskManifest;
  }): Promise<void>;
}> {
  try {
    const mod = await import(name);
    return mod.default ?? mod;
  } catch {
    console.warn(`[thenjs] Adapter "${name}" not found, using no-op adapter`);
    return {
      async buildEnd() {
        // No-op
      },
    };
  }
}

function findClientEntries(_root: string): Record<string, string> {
  // In a real implementation, scan src/pages/ for client entry points
  return {
    main: 'src/entry-client.tsx',
  };
}

async function prerenderStaticPages(_root: string, _outDir: string): Promise<string[]> {
  // TODO: Load route manifest, find static pages, render to HTML
  return [];
}

async function buildRouteManifest(_root: string): Promise<RouteManifest> {
  // TODO: Scan src/pages, src/api, src/rpc
  return {
    pages: [],
    api: [],
    rpc: [],
  };
}

async function buildTaskManifest(_root: string): Promise<TaskManifest> {
  // TODO: Scan src/tasks
  return {
    cron: [],
    queue: [],
  };
}
