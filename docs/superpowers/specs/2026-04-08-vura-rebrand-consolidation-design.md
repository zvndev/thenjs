# Vura Rebrand + Consolidation Design

**Date:** 2026-04-08
**Status:** Approved

## Context

Three repos exist for the same product family:
- **`then`** — Slim monorepo (3 packages) built on CelsianJS. Lambda + Cloudflare adapters. 1 commit, March 2026.
- **`thenjs`** — Full monorepo (8 packages) built on What Framework. Server, RPC, schema, build, CLI, docs, VS Code extension. 5 commits, Feb 2026.
- **`vura-platform`** — Deployment platform for the framework. Actively developed.

`then` and `thenjs` are partial duplicates with no code sharing. `thenjs` is the canonical, more complete implementation. The only unique value in `then` is two well-tested deployment adapters (Lambda, Cloudflare Workers) that `thenjs` lacks.

## Decision

1. Port Lambda and Cloudflare adapters from `then` into `thenjs`
2. Full rebrand of `thenjs` to **Vura**
3. Archive `then`

## Stack Identity

| Layer | Project | Analogy |
|---|---|---|
| Frontend framework | What Framework | React |
| Backend framework | CelsianJS | NestJS/Express |
| Meta-framework | **Vura** | Next.js |
| Deployment platform | **Vura Platform** | Vercel |

## Package Rename Map

| Current | New |
|---|---|
| `thenjs-monorepo` (root) | `vura` |
| `thenjs` (CLI pkg) | `vura` |
| `@thenjs/server` | `@vura/server` |
| `@thenjs/rpc` | `@vura/rpc` |
| `@thenjs/schema` | `@vura/schema` |
| `@thenjs/build` | `@vura/build` |
| `@thenjs/adapter-node` | `@vura/adapter-node` |
| `@thenjs/adapter-vercel` | `@vura/adapter-vercel` |
| `create-then` | `create-vura` |

## New Packages (ported from `then`)

| Package | Source | Notes |
|---|---|---|
| `@vura/adapter-lambda` | `@then/adapter-lambda` | Rewire from `@then/core` manifest → `@vura/build` manifest |
| `@vura/adapter-cloudflare` | `@then/adapter-cloudflare` | Same rewire |

## Rename Targets

### Source code
- All `@thenjs/*` imports → `@vura/*` across every `.ts`, `.tsx`, `.js`, `.mjs` file
- Virtual module IDs: `virtual:then-routes` → `virtual:vura-routes`, `virtual:then-manifest` → `virtual:vura-manifest`, `virtual:then-rpc-client` → `virtual:vura-rpc-client`
- Config loader: `then.config.ts/js/mjs` → `vura.config.ts/js/mjs`
- `defineConfig` and `loadConfig` — update file scanning paths
- `ThenApp`, `ThenConfig`, `ThenRequest`, `ThenReply`, `ThenVitePluginOptions` → `VuraApp`, `VuraConfig`, `VuraRequest`, `VuraReply`, `VuraVitePluginOptions`

### Package metadata
- Every `package.json`: name, bin entries, dependency references
- CLI binary: `thenjs` → `vura`
- `create-then` → `create-vura` (bin name + generated content)

### Tooling & docs
- VS Code extension: display name, grammar scope names, snippet prefixes (`then-*` → `vura-*`)
- Docs site: all ThenJS copy → Vura
- GitHub Actions workflows: any string references
- Examples: config files, imports, package.json
- Tests: string assertions, snapshot values

### What stays unchanged
- `what-framework` — separate identity
- `@celsian/core` — referenced as external dep where needed
- `vura-platform` — already correctly named
- All architecture, APIs, hook lifecycle — zero functional changes

## Adapter Port Strategy

The `@then/core` manifest system is not ported — `@vura/build` already handles route scanning and manifest generation via Vite plugin. The adapters need to be rewired:

**Lambda adapter:**
- Replace `@then/core` types (`RouteManifest`, `ApiRoute`, etc.) with `@vura/build` equivalents (`BuildResult`, route manifest)
- Keep all AWS-specific logic intact: event/response conversion, SAM template generation, handler wrapping
- Adapter interface: implement `buildEnd(context)` hook pattern from `@vura/build`

**Cloudflare adapter:**
- Same rewire: `@then/core` types → `@vura/build` types
- Keep all CF-specific logic: wrangler.toml generation, KV/D1/R2 bindings, worker entry generation
- Implement `buildEnd(context)` hook pattern

## Archive Plan

- Archive `then` GitHub repo (read-only)
- No npm unpublish needed (never published)
