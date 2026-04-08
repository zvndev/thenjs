// @vura/build — Production build pipeline

import type { VuraConfig } from '@vura/server';

export interface BuildOptions {
  config: VuraConfig;
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

  console.log(`[vura] Building for ${adapterName}...`);
  console.log(`[vura] Root: ${root}`);
  console.log(`[vura] Output: ${outDir}`);

  // 2. Run Vite builds (client + server)
  const { build: viteBuild } = await import('vite');
  const { vuraVitePlugin } = await import('./vite-plugin.js');

  // Client build
  console.log('[vura] Building client...');
  await viteBuild({
    root,
    plugins: vuraVitePlugin({ config }),
    build: {
      outDir: `${outDir}/client`,
      manifest: true,
      rollupOptions: {
        input: findClientEntries(root),
      },
    },
  });

  // Server build
  console.log('[vura] Building server...');
  await viteBuild({
    root,
    plugins: vuraVitePlugin({ config }),
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
  console.log('[vura] Pre-rendering static pages...');
  const staticPages = await prerenderStaticPages(root, outDir);

  // 4. Build route manifest
  const routes = await buildRouteManifest(root);
  const tasks = await buildTaskManifest(root);

  // 5. Run adapter transform
  console.log(`[vura] Running ${adapterName} adapter...`);
  const adapter = await loadAdapter(adapterName);
  await adapter.buildEnd({
    serverEntry: `${outDir}/server/entry-server.js`,
    clientDir: `${outDir}/client`,
    staticDir: `${outDir}/static`,
    routes,
    tasks,
  });

  console.log('[vura] Build complete!');

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
  if (adapter === 'node') return '@vura/adapter-node';
  if (adapter === 'vercel') return '@vura/adapter-vercel';
  return adapter;
}

function detectAdapter(): string {
  if (process.env.VERCEL) return '@vura/adapter-vercel';
  if (process.env.NETLIFY) return '@vura/adapter-netlify';
  if (process.env.CF_PAGES) return '@vura/adapter-cloudflare';
  return '@vura/adapter-node';
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
    console.warn(`[vura] Adapter "${name}" not found, using no-op adapter`);
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
