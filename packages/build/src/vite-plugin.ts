// @vura/build — Vura Vite plugin
// Wraps what-compiler/vite and adds Vura-specific virtual modules

import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import type { VuraConfig } from '@vura/server';

const VIRTUAL_ROUTES = 'virtual:vura-routes';
const VIRTUAL_MANIFEST = 'virtual:vura-manifest';
const VIRTUAL_RPC_CLIENT = 'virtual:vura-rpc-client';
const RESOLVED_PREFIX = '\0';

export interface VuraVitePluginOptions {
  config?: VuraConfig;
  /** Root directory of the user's project */
  root?: string;
}

export function vuraVitePlugin(options: VuraVitePluginOptions = {}): Plugin[] {
  const config = options.config ?? {};
  let resolvedConfig: ResolvedConfig;
  let devServer: ViteDevServer | undefined;

  const mainPlugin: Plugin = {
    name: 'vura',
    enforce: 'pre',

    configResolved(resolved) {
      resolvedConfig = resolved;
    },

    configureServer(server) {
      devServer = server;

      // Add SSR middleware for page routes
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '/';

        // Skip Vite's internal paths and static assets
        if (url.startsWith('/@') || url.startsWith('/__') || url.includes('.')) {
          return next();
        }

        // Skip API routes (handled separately)
        if (url.startsWith('/api/') || url.startsWith('/_rpc/')) {
          return next();
        }

        try {
          // Load the SSR entry module
          const ssrEntry = await server.ssrLoadModule('/src/entry-server.tsx');

          if (typeof ssrEntry.render === 'function') {
            const html = await ssrEntry.render(url);

            // Apply Vite HTML transforms (inject HMR client, etc.)
            const transformedHtml = await server.transformIndexHtml(url, html);

            res.setHeader('content-type', 'text/html');
            res.end(transformedHtml);
          } else {
            next();
          }
        } catch (e) {
          server.ssrFixStacktrace(e as Error);
          next(e);
        }
      });

      // API route middleware
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '/';

        if (!url.startsWith('/api/')) {
          return next();
        }

        try {
          // Load the API route handler
          const apiModule = await server.ssrLoadModule(`/src${url}.ts`).catch(() =>
            server.ssrLoadModule(`/src${url}.js`),
          );

          const method = req.method?.toUpperCase() ?? 'GET';
          const handler = apiModule[method] ?? apiModule.default;

          if (typeof handler === 'function') {
            // Convert Node req to Web Standard Request
            const webRequest = toWebRequest(req);
            const response: Response = await handler(webRequest);

            // Write response back to Node res
            res.statusCode = response.status;
            for (const [key, value] of response.headers.entries()) {
              res.setHeader(key, value);
            }
            const body = await response.text();
            res.end(body);
          } else {
            next();
          }
        } catch (e) {
          server.ssrFixStacktrace(e as Error);
          next(e);
        }
      });

      // RPC middleware
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '/';

        if (!url.startsWith('/_rpc/')) {
          return next();
        }

        try {
          // Load all RPC routers from src/rpc/
          const rpcModule = await server.ssrLoadModule('/src/rpc/index.ts').catch(() => null);

          if (rpcModule) {
            const { RPCHandler } = await import('@vura/rpc');
            const handler = new RPCHandler(rpcModule.default ?? rpcModule);
            const webRequest = toWebRequest(req);
            const response = await handler.handle(webRequest);

            res.statusCode = response.status;
            for (const [key, value] of response.headers.entries()) {
              res.setHeader(key, value);
            }
            const body = await response.text();
            res.end(body);
          } else {
            next();
          }
        } catch (e) {
          server.ssrFixStacktrace(e as Error);
          next(e);
        }
      });
    },

    resolveId(id) {
      if (id === VIRTUAL_ROUTES) return RESOLVED_PREFIX + VIRTUAL_ROUTES;
      if (id === VIRTUAL_MANIFEST) return RESOLVED_PREFIX + VIRTUAL_MANIFEST;
      if (id === VIRTUAL_RPC_CLIENT) return RESOLVED_PREFIX + VIRTUAL_RPC_CLIENT;
      return null;
    },

    load(id) {
      if (id === RESOLVED_PREFIX + VIRTUAL_ROUTES) {
        return generateRoutesVirtualModule(resolvedConfig?.root ?? process.cwd());
      }

      if (id === RESOLVED_PREFIX + VIRTUAL_MANIFEST) {
        return generateManifestVirtualModule();
      }

      if (id === RESOLVED_PREFIX + VIRTUAL_RPC_CLIENT) {
        return generateRPCClientVirtualModule();
      }

      return null;
    },
  };

  return [mainPlugin];
}

// ─── Virtual Module Generators ───

function generateRoutesVirtualModule(root: string): string {
  // This will be populated during build by scanning src/pages/
  // In dev, it uses what-compiler's scanPages
  return `
// Auto-generated by @vura/build
// This module re-exports what-compiler's route scanning with Vura extensions

let routes = [];
let apiRoutes = [];
let pageModes = {};

// Vura extensions
let errorPages = {};
let loadingPages = {};

export { routes, apiRoutes, pageModes, errorPages, loadingPages };
`;
}

function generateManifestVirtualModule(): string {
  return `
// Auto-generated by @vura/build
export const manifest = {
  routes: [],
  apiRoutes: [],
  rpcProcedures: [],
  tasks: [],
};
`;
}

function generateRPCClientVirtualModule(): string {
  return `
// Auto-generated by @vura/build
import { createRPCClient } from '@vura/rpc';
export const rpc = createRPCClient({ baseUrl: '/_rpc' });
`;
}

// ─── Helpers ───

function toWebRequest(nodeReq: any): Request {
  const protocol = nodeReq.headers['x-forwarded-proto'] ?? 'http';
  const host = nodeReq.headers.host ?? 'localhost';
  const url = new URL(nodeReq.url ?? '/', `${protocol}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(nodeReq.headers)) {
    if (typeof value === 'string') {
      headers.set(key, value);
    } else if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    }
  }

  const method = nodeReq.method ?? 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD';

  return new Request(url.toString(), {
    method,
    headers,
    body: hasBody ? nodeReq : undefined,
    // @ts-expect-error Node.js specific
    duplex: hasBody ? 'half' : undefined,
  });
}
