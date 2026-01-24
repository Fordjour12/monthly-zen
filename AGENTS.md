# AGENTS.md

Guidance for agentic coding tools working in this repository.

## Repository Snapshot

- Monorepo (Turborepo + bun workspaces).
- Web: TanStack Start + Tailwind CSS v4.
- Server: Hono + oRPC.
- Native: Expo React Native app with app variants.
- DB: PostgreSQL + Drizzle ORM.
- Auth: better-auth (email/password).
- Lint/format: oxlint + oxfmt (Husky + lint-staged).

## Key Paths

- `apps/web/` - TanStack Start frontend.
- `apps/server/` - Hono API server.
- `apps/native/` - Expo mobile app.
- `packages/api/` - oRPC routers + context.
- `packages/auth/` - better-auth configuration.
- `packages/db/` - Drizzle schema + db client.
- `packages/config/` - shared TS config.

## Build / Lint / Type Check / Test

Root commands (run from repo root):

- `bun install` - install dependencies.
- `bun run dev` - start all apps via Turbo.
- `bun run dev:web` - web only.
- `bun run dev:server` - server only.
- `bun run dev:native` - native only (development variant).
  Note: dont run the de sever because they would be runing already

- `bun run build` - build all workspaces.
- `bun run check-types` - typecheck all workspaces.
- `bun run check` - oxlint + oxfmt (auto-fixes).

Workspace-specific build commands:

- `bun run -F web build` - web build.
- `bun run -F server build` - server build (tsdown).
- `bun run -F native start` - Expo dev server (production variant).

Database (root only; delegates to db workspace):

- `bun run db:start` - start Postgres via Docker.
- `bun run db:stop` - stop DB container.
- `bun run db:down` - stop + remove container.
- `bun run db:push` - push schema to dev DB.
- `bun run db:generate` - generate migrations.
- `bun run db:migrate` - run migrations.
- `bun run db:studio` - open Drizzle Studio.

Testing status:

- No repo-level `test` script is defined yet.
- Web includes `@testing-library/*` dev deps; oxlint has Vitest settings.
- If you add tests, prefer a workspace `test` script and run via Turbo:
  - `bun run -F web test -- <pattern>` (single test filter depends on runner).
- For single-test runs, use the runner's filter flag (e.g., `-t`/`--testNamePattern`).

## Code Style Guidelines

Formatting

- oxfmt is the source of truth; let it format files.
- Two-space indentation, trailing commas where applicable.
- Double quotes for strings; semicolons are used.

Imports

- External imports first, then blank line, then internal/relative imports.
- Use `import type` for type-only imports.
- Web app uses `@/` alias (see `apps/web/`); other packages use relative paths.

TypeScript

- Prefer explicit types for public APIs and shared exports.
- Keep `any` out of new code; use Zod schemas + `z.infer`.
- Use `as const` for static arrays/objects that should be literal types.

React (Web + Native)

- Function components; hooks at top level.
- Prefer `const` for component-local constants.
- Use Tailwind classes + `cn()` helper (`apps/web/src/lib/utils.ts`).

Backend (Hono + oRPC)

- Validate inputs with Zod; keep schemas near handlers.
- Use `publicProcedure` or `protectedProcedure` from `packages/api/src/index.ts`.
- Throw `ORPCError` for auth failures; return JSON with status codes for request errors.
- Handle streaming with explicit keepalive + error serialization (see `apps/server/src/index.ts`).

Database

- Add new schema files under `packages/db/src/schema/` and export from `schema/index.ts`.
- Run `bun run db:push` for dev sync, `db:generate` + `db:migrate` for migrations.

Error Handling

- Use `try/catch` for external calls or JSON parsing.
- Surface clean error messages; avoid leaking internals.
- Prefer early returns on validation failures.

Naming

- camelCase for variables/functions; PascalCase for components/types.
- Route files follow TanStack Start conventions (file-based in `apps/web/src/routes/`).
- Keep exported router objects in `packages/api/src/routers/`.

## oRPC Usage

- Add routers in `packages/api/src/routers/` and export via `routers/index.ts`.
- Web client uses `apps/web/src/utils/orpc.ts`.
- Protected routes require `protectedProcedure` (session required).

## Environment Files

- Server: `apps/server/.env` (DATABASE_URL, auth secrets, CORS).
- Web: `apps/web/.env` (VITE_SERVER_URL).
- Native: `apps/native/.env` (EXPO_PUBLIC_SERVER_URL, APP_VARIANT).

## Cursor / Copilot Rules

- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` found.
