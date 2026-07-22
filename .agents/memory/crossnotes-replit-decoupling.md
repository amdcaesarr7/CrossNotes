---
name: CrossNotes Replit decoupling
description: How Replit-specific coupling was removed so the app builds anywhere with zero env vars
---

## Rule
`vite.config.ts` must never throw on missing `PORT`, `BASE_PATH`, or `REPL_ID`.
All `@replit/*` vite plugins must be conditional on `process.env.REPL_ID !== undefined`.

## Pattern (vite.config.ts)
```ts
const port = Number(process.env.PORT) || 5173;
const basePath = process.env.BASE_PATH || '/';

const replitPlugins =
  process.env.REPL_ID !== undefined
    ? await Promise.all([
        import('@replit/vite-plugin-runtime-error-modal').then((m) => m.default()),
        ...(process.env.NODE_ENV !== 'production'
          ? [
              import('@replit/vite-plugin-cartographer').then(...),
              import('@replit/vite-plugin-dev-banner').then(...),
            ]
          : []),
      ])
    : [];
```

**Why:** The scaffold's generated `vite.config.ts` throws hard errors when `PORT`/`BASE_PATH` are absent, breaking `pnpm build` outside Replit. The `@replit/*` plugins are Replit-dev-only and must be skipped everywhere else.

## mockup-sandbox exclusion
Root `package.json` build script uses `--filter '!./artifacts/mockup-sandbox'`:
```json
"build": "pnpm run typecheck && pnpm -r --filter '!./artifacts/mockup-sandbox' --if-present run build"
```
**Why:** mockup-sandbox is Replit's design canvas harness; its vite config requires `REPL_ID` and it has no place in a production build.

## @replit/* packages
Keep in devDependencies — they install fine anywhere, just do nothing when `REPL_ID` is absent. No need to remove them.
