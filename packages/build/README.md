# @vura/build

Vite plugin and production build pipeline for Vura. Handles SSR middleware, API routes, RPC, virtual modules, and multi-step client + server builds with adapter integration.

## Install

```
npm install @vura/build
```

Peer dependencies: `vite ^6.0.0`, `what-framework`.

## Usage

### Vite Plugin

Add `vuraVitePlugin` to your Vite config. In most cases the `vura` CLI does this for you automatically:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { vuraVitePlugin } from '@vura/build';

export default defineConfig({
  plugins: [
    ...vuraVitePlugin({
      config: {
        server: { defaultPageMode: 'hybrid' },
      },
    }),
  ],
});
```

The plugin provides:

- **SSR middleware** -- renders pages via `src/entry-server.tsx` during dev
- **API route middleware** -- auto-loads handlers from `src/api/` (file-based)
- **RPC middleware** -- serves `/_rpc/` calls from `src/rpc/index.ts`
- **Virtual modules** -- `virtual:vura-routes`, `virtual:vura-manifest`, `virtual:vura-rpc-client`

### Production Build

`build()` runs a full client + server Vite build, pre-renders static pages, generates route and task manifests, and invokes the configured adapter:

```typescript
import { build } from '@vura/build';
import { loadConfig } from '@vura/server';

const config = await loadConfig();

const result = await build({
  config,
  root: process.cwd(),
});

// result.clientDir   -- built client assets
// result.serverEntry -- SSR entry bundle
// result.staticDir   -- pre-rendered HTML
// result.routes      -- RouteManifest (pages, api, rpc)
// result.tasks       -- TaskManifest (cron, queue)
```

### Virtual Modules

Import these in application code to access auto-generated route data:

```typescript
import { routes, apiRoutes, pageModes } from 'virtual:vura-routes';
import { manifest } from 'virtual:vura-manifest';
import { rpc } from 'virtual:vura-rpc-client';
```

## API

| Export | Description |
|---|---|
| `vuraVitePlugin(options?)` | Returns Vite `Plugin[]`. Options: `{ config?, root? }` |
| `build(options)` | Run a full production build. Options: `{ config, root }` |
| `VuraVitePluginOptions` | Plugin option types |
| `BuildOptions` / `BuildResult` | Build input/output types |
| `RouteManifest` | Pages, API routes, and RPC procedures discovered at build time |
| `TaskManifest` | Cron jobs and queue workers discovered at build time |

## License

[MIT](../../LICENSE)
