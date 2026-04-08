# Vura

**The meta-framework for [What Framework](https://github.com/zvndev/what-fw).**

Vura provides file-based routing, server-side rendering, type-safe RPC, schema validation, and deployment adapters — all built on Web Standard APIs.

## Packages

| Package | Description |
|---------|-------------|
| [`vura`](packages/vura) | Main package — CLI + re-exports |
| [`@vura/server`](packages/server) | Hook-based server runtime (Web Standard APIs) |
| [`@vura/rpc`](packages/rpc) | Type-safe RPC with schema validation |
| [`@vura/schema`](packages/schema) | Standard schema adapter (Zod, TypeBox, Valibot) |
| [`@vura/build`](packages/build) | Vite plugin + production build pipeline |
| [`@vura/adapter-node`](packages/adapter-node) | Node.js deployment adapter |
| [`@vura/adapter-vercel`](packages/adapter-vercel) | Vercel deployment adapter |
| [`create-vura`](packages/create-vura) | Project scaffolder (`npx create-vura`) |

## Quick Start

```bash
npx create-vura my-app
cd my-app
npm install
npx vura dev
```

## Architecture

```
┌─────────────────────────────────────────────┐
│                   vura                       │
│              (CLI + re-exports)              │
├──────────┬──────────┬───────────────────────┤
│  server  │  build   │         rpc           │
│  (hooks, │  (Vite   │  (procedures,         │
│  router, │  plugin, │   router, client,     │
│  reply)  │  bundle) │   wire protocol)      │
├──────────┴──────────┼───────────────────────┤
│                     │       schema           │
│                     │  (Zod/TypeBox/Valibot) │
├─────────────────────┴───────────────────────┤
│          adapter-node / adapter-vercel       │
└─────────────────────────────────────────────┘
```

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Watch mode
npm run dev
```

## Project Structure

```
vura/
├── packages/
│   ├── schema/          # Standard schema adapter
│   ├── server/          # Hook-based server
│   ├── rpc/             # Type-safe RPC
│   ├── build/           # Vite plugin + build
│   ├── vura/          # Main CLI package
│   ├── adapter-node/    # Node.js adapter
│   ├── adapter-vercel/  # Vercel adapter
│   └── create-vura/     # Project scaffolder
├── examples/
│   ├── starter/         # Basic app
│   └── full-stack/      # Full-stack with RPC
└── docs-site/           # Documentation
```

## License

[MIT](LICENSE)
