# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Better-T-Stack monorepo using Turborepo and bun workspaces with:

- **Frontend**: TanStack Start (React SSR framework) with Tailwind CSS v4
- **Backend**: Hono server with oRPC for type-safe APIs
- **Mobile**: Expo React Native app with app variants (dev/preview/production)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: better-auth with email/password
- **API Layer**: oRPC (provides end-to-end type safety)
- **Linting**: oxlint with oxfmt formatting (enforced by Husky)

## Directory Structure

- `apps/web/` - TanStack Start frontend application
- `apps/server/` - Hono backend server
- `apps/native/` - Expo React Native mobile app
- `packages/api/` - Shared oRPC routers and context
- `packages/auth/` - better-auth configuration
- `packages/db/` - Drizzle schema and database client
- `packages/config/` - Shared TypeScript configuration

## Common Commands

### Development

- `bun run dev` - Start all apps (web + server)
- `bun run dev:web` - Start only web app (<http://localhost:3000>)
- `bun run dev:server` - Start only server (<http://localhost:3001>)
- `bun run dev:native` - Start native app (development variant)

### Mobile App (Native)

Run from `apps/native/` directory or use workspace commands:

- `bunx expo start` - Start Expo dev server (production variant)
- `bun run dev` - Start development variant (sets APP_VARIANT=development)
- `bunx expo run:android` - Run on Android device/emulator
- `bunx expo run:ios` - Run on iOS simulator/device
- `bunx eas build --profile development` - Build development variant
- `bunx eas build --profile preview` - Build preview variant
- `bunx eas build --profile production` - Build production variant

### Build & Type Checking

- `bun run build` - Build all apps
- `bun run check-types` - Run TypeScript checks across all workspaces

### Linting & Formatting

- `bun run check` - Run oxlint and oxfmt (auto-fixes issues)
- Runs automatically on pre-commit via Husky

### Database Operations

All database commands must be run from the root (they delegate to the db package):

- `bun run db:start` - Start PostgreSQL container (Docker Compose)
- `bun run db:stop` - Stop database container
- `bun run db:down` - Stop and remove database container
- `bun run db:push` - Push schema changes to database (development)
- `bun run db:generate` - Generate migration files from schema
- `bun run db:migrate` - Run database migrations
- `bun run db:studio` - Open Drizzle Studio (database GUI)

## Architecture

### API Layer (oRPC)

The project uses oRPC for type-safe client-server communication:

**Server-side** (`packages/api/`):

- `routers/index.ts` - API route definitions (appRouter)
- `context.ts` - Creates context with session from better-auth
- `index.ts` - Exports `publicProcedure` and `protectedProcedure` builders
  - `publicProcedure` - No authentication required
  - `protectedProcedure` - Requires authenticated session

**Example router**:

```typescript
// packages/api/src/routers/example.ts
export const exampleRouter = {
  hello: publicProcedure
    .input(z.object({ name: z.string() }))
    .handler(({ input }) => {
      return { message: `Hello ${input.name}` };
    }),

  secret: protectedProcedure
    .handler(({ context }) => {
      return { user: context.session?.user };
    }),
};
```

**Client-side** (`apps/web/src/utils/orpc.ts`):

- `client` - oRPC client for making typed API calls
- `orpc` - TanStack Query integration for reactive data fetching
- Isomorphic: uses direct router calls on server, HTTP fetch on client

**Usage in components**:

```typescript
import { orpc } from "@/utils/orpc";

// In a loader (server-side)
const data = await orpc.example.hello({ name: "World" });

// In a component (client-side with TanStack Query)
const query = orpc.example.hello.useQuery({ name: "World" });
```

### Authentication

better-auth is configured in `packages/auth/src/index.ts`:

- Email/password authentication enabled
- Uses Drizzle adapter with PostgreSQL
- Session-based with secure cookies (sameSite: none, secure: true)
- Expo plugin included for native mobile support

**Server auth handler** (`apps/server/src/index.ts`):

- `/api/auth/*` routes handled by better-auth

**Client auth** (`apps/web/src/lib/auth-client.ts`):

- Exports configured auth client for frontend

**Protected routes**:

- In oRPC: Use `protectedProcedure` wrapper
- In TanStack Router: Use middleware in `apps/web/src/middleware/auth.ts`

### Database

**Schema location**: `packages/db/src/schema/`

- Currently has auth schema (managed by better-auth)
- Add additional tables in new schema files

**Database client**: `packages/db/src/index.ts`

- Exports `db` instance (Drizzle with PostgreSQL)

**Environment variables** (`apps/server/.env`):

- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Secret for auth tokens
- `BETTER_AUTH_URL` - URL of auth API
- `CORS_ORIGIN` - Allowed CORS origin for web app

### Frontend Routing

TanStack Start file-based routing in `apps/web/src/routes/`:

- File-based routes (e.g., `routes/index.tsx`, `routes/dashboard.tsx`)
- `__root.tsx` - Root layout with providers
- Loaders run on server for data fetching
- Router configured in `apps/web/src/router.tsx`

### Styling

- **Tailwind CSS v4** with `@tailwindcss/vite` plugin (web)
- **uniwind** for Tailwind in React Native (native)
- Components use `class-variance-authority` for variants
- `tailwind-merge` via `cn()` utility in `apps/web/src/lib/utils.ts`
- UI components in `apps/web/src/components/ui/` (shadcn-based)

### Mobile App (Expo)

The native app supports multiple variants that can be installed simultaneously on the same device:

**App Variants**:

- **Development**: `com.thedevelophantom.monthlyzen.dev` - Display name: "Monthly Zen (Dev)"
- **Preview**: `com.thedevelophantom.monthlyzen.preview` - Display name: "Monthly Zen (Preview)"
- **Production**: `com.thedevelophantom.monthlyzen` - Display name: "Monthly Zen"

**Configuration** (`apps/native/app.config.ts`):

- TypeScript-based config using `APP_VARIANT` environment variable
- Automatically switches bundle identifier, app name, and deep link scheme
- Development variant enables Expo dev client scheme for QR code scanning

**Building variants**:

- Development: `APP_VARIANT=development` set automatically in `eas.json`
- Preview: `APP_VARIANT=preview` set automatically in `eas.json`
- Production: No `APP_VARIANT` set (default)

**Environment variables** (`apps/native/.env`):

- `EXPO_PUBLIC_SERVER_URL` - Backend server URL for API calls
- `APP_VARIANT` - Variant to use (development/preview/empty for production)

## Adding New Features

### Adding an oRPC Endpoint

1. Define the procedure in `packages/api/src/routers/` or create a new router file
2. Export from `packages/api/src/routers/index.ts` in `appRouter`
3. Use from frontend: `orpc.yourRouter.yourProcedure.useQuery()`

### Adding Database Tables

1. Create schema file in `packages/db/src/schema/your-table.ts`
2. Export from `packages/db/src/schema/index.ts`
3. Run `bun run db:push` to update database (development) or `bun run db:generate` + `bun run db:migrate` for migrations

### Adding Protected Routes

In oRPC routers, use `protectedProcedure` which automatically validates the session.

### Environment Configuration

- Server: `apps/server/.env`
- Web: `apps/web/.env` (contains `VITE_SERVER_URL`)
- Native: `apps/native/.env` (contains `EXPO_PUBLIC_SERVER_URL`, `APP_VARIANT`)
- Examples in corresponding `.env.example` files

## Important Notes

- Database credentials are in `apps/server/.env` (loaded by `packages/db/drizzle.config.ts`)
- Server runs on port 3001 by default
- Web app runs on port 3000 by default
- All database operations must go through the db package workspace
- Turborepo handles task orchestration and caching
  k Husky pre-commit hook runs oxlint + oxfmt automatically
