# vura

The main package for Vura -- a meta-framework for What Framework. Provides the CLI for development, production builds, and preview, plus re-exports from `@vura/server`, `@vura/build`, and `@vura/rpc`.

## Install

```
npm install vura
```

## CLI

```
npx vura dev          # Start dev server with HMR (default command)
npx vura build        # Production build (client + server + static)
npx vura preview      # Preview the production build locally
```

### Options

| Flag | Alias | Description | Default |
|---|---|---|---|
| `--port <port>` | `-p` | Server port | `3000` |
| `--host <host>` | `-H` | Server host | `localhost` |
| `--open` | `-o` | Open in browser | `false` |
| `--help` | `-h` | Show help | |
| `--version` | `-v` | Show version | |

## Configuration

Create a `vura.config.ts` at your project root:

```typescript
import { defineConfig } from 'vura';

export default defineConfig({
  server: {
    port: 3000,
    host: 'localhost',
    defaultPageMode: 'hybrid', // 'client' | 'server' | 'static' | 'hybrid'
  },
  build: {
    adapter: 'auto', // 'auto' | 'node' | 'vercel' | custom string
    outDir: 'dist',
  },
  rpc: {
    schema: 'zod',
    openapi: {
      title: 'My API',
      version: '1.0.0',
    },
  },
  what: {
    compiler: {
      mode: 'fine-grained', // 'vdom' | 'fine-grained'
    },
  },
});
```

## Re-exports

`vura` re-exports the most common APIs so you can import from a single package:

```typescript
// Server
import { createApp, defineConfig, loadConfig } from 'vura';
import type { ThenConfig, ThenApp, ThenRequest, ThenReply } from 'vura';

// Build
import { thenVitePlugin } from 'vura';
import type { ThenVitePluginOptions } from 'vura';

// RPC
import { procedure, router, createRPCClient } from 'vura';
import type { RPCContext, ProcedureDefinition, RouterDefinition } from 'vura';
```

## API

| Export | Source |
|---|---|
| `createApp` | `@vura/server` |
| `defineConfig` / `loadConfig` | `@vura/server` |
| `thenVitePlugin` | `@vura/build` |
| `procedure` / `router` | `@vura/rpc` |
| `createRPCClient` | `@vura/rpc` |

## License

[MIT](../../LICENSE)
