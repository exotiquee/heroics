# Heroics

A free, local-first life suite: **Fitness**, **Finance** and **Projects** as separate apps that share one data spine and one personal AI. Privacy is enforced by the system, not promised in a prompt.

Blueprint: [Heroics Suite — Architecture & App Blueprint](https://claude.ai/artifact/2xaEPnC9f4ttWvchqkqwDq)

## What's in this repo

```
apps/
  web/          SvelteKit web suite: HQ, Fitness, Finance, Projects + side switcher
packages/
  policy/       Labels, grants, taint tracking, routing and redaction (tested)
  schema/       Postgres migrations with row-level security + TS types (tested on real Postgres)
  events/       Typed event catalog for the outbox
  ui/           Design tokens, motion, icons, charts, badges (Svelte 5)
```

Still to come, per the blueprint's build order: `services/api` (write path + MCP gateway), `services/router`, PowerSync config, `infra/compose` for Heroics Home, and the native Capacitor plugins.

## Run it

```bash
pnpm install
pnpm dev                 # web suite at http://localhost:5173
pnpm test                # policy + events unit tests
pnpm check               # typecheck every package (svelte-check fails on warnings)
pnpm --filter @heroics/schema test:db   # migrations + RLS tests on a throwaway Postgres 15+
pnpm build               # static build in apps/web/build
```

Requires Node 20+ and pnpm 10. The database tests need Postgres binaries (`initdb`, `pg_ctl`, `psql`) on the machine.

## The rules that hold it together

1. **Every record carries a label**: `open`, `personal`, `private` or `sealed`. Sealed data (progress photos, receipts, documents) never leaves your own devices; the server only stores ciphertext.
2. **Cloud AI is a gate, not a setting.** `@heroics/policy` decides where a run may execute. Cloud can only ever see `personal` facts under an explicit, scoped, expiring grant. Once a run reads private data it stays local for good (taint only rises). No silent fallback to the cloud.
3. **The database enforces visibility.** Row-level security keeps a partner's private budget, a teen's view of finance and an outside guest's view of projects correct even if the app has a bug.
4. **Apps never read each other's tables.** They talk through MCP tools and the event outbox.

## Web suite

- Hash routing, so the static build runs from any path or file host. Switch to path routing once it runs behind its own server.
- Shortcuts: `⌘K` / `Ctrl+K` command palette, `⌘J` assistant, `⌘1–4` switch apps.
- Screens run on sample data with a fixed "today" (18 Nov 2026). The privacy router demo on the ledger page runs the real `@heroics/policy` code.
