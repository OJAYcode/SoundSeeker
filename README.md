# SoundSeeker

A private, platform-agnostic song identification PWA.

## Workspace

- `apps/web` — React + Vite client
- `apps/api` — Fastify service
- `packages/shared` — shared validation schemas and types

## Local setup

1. Copy `.env.example` to `.env` and fill in the ACRCloud values.
2. Run `pnpm install`.
3. Run `pnpm dev`.

The web client runs on Vite's default port (`5173`) and the API runs on `3000`.

## Verification

Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` before deploying. See [DEPLOYMENT.md](DEPLOYMENT.md) for hosting instructions.
