# Monthly Zen

Monthly Zen is an AI-powered habit coaching and monthly planning platform designed to help users build consistent habits, achieve their goals, and maintain productivity without burning out.

## What Monthly Zen Does

- **AI-Powered Monthly Planning**: Generate personalized monthly plans based on your goals, priorities, and schedule constraints
- **Habit Tracking**: Track task completion across the month with visual calendar and heatmap views
- **Predictive Coaching Insights**: AI analyzes your patterns to detect burnout risks, identify your most productive days, and suggest maintenance weeks before you hit a wall
- **Pattern Recognition**: Understand your weekly and monthly productivity rhythms through data-driven insights
- **Goal Management**: Set and track monthly resolutions with AI-assisted plan generation
- **Smart Quotas**: Manage your AI plan generation limits with usage tracking

## Features

### Core Functionality

- **Monthly Plan Generation**: AI creates balanced monthly plans considering your goals, focus areas, task complexity preferences, and fixed commitments
- **Habit & Task Management**: Daily task views with completion tracking, organized by week and focus area
- **Coaching Dashboard**: AI-generated insights about your productivity patterns, burnout risk, and personalized suggestions
- **Calendar Views**: Monthly calendar with heatmap visualization showing completion trends
- **Pattern Analytics**: Weekly completion patterns, day-of-week analysis, and focus area trends
- **User Preferences**: Customizable settings for task complexity, weekend work preferences, and focus areas
- **Goal Tracking**: Monthly resolutions with progress tracking and AI-generated action plans
- **Usage Quotas**: Track and manage AI plan generation limits

### AI Coaching Features

- **Burnout Risk Detection**: Predictive alerts when your patterns suggest potential exhaustion
- **Maintenance Mode Suggestions**: AI recommends reduced-intensity weeks based on your historical data
- **Peak Energy Identification**: Identifies your most productive days and times
- **Declining Trend Alerts**: Warns when focus areas show decreasing completion rates
- **Actionable Insights**: Every insight includes a concrete suggested action you can accept, dismiss, or snooze
- **Pattern Analysis**: Weekly and monthly productivity rhythm analysis

### Platforms

- **Web App**: Full-featured desktop experience with TanStack Start (React SSR)
- **Mobile App**: Native iOS and Android experience with Expo React Native, supporting multiple app variants (dev/preview/production)

## Tech Stack

- **TypeScript** - Type safety throughout the codebase
- **TanStack Start** - SSR React framework with file-based routing
- **React Native + Expo** - Cross-platform mobile development with app variants
- **Hono + oRPC** - High-performance backend with end-to-end type-safe APIs
- **PostgreSQL + Drizzle ORM** - Type-safe database operations
- **Better-Auth** - Secure authentication with email/password and Expo support
- **OpenRouter** - AI integration for plan generation and coaching insights using Claude models
- **Tailwind CSS v4** - Utility-first styling for web
- **uniwind** - Tailwind utility mapping for React Native
- **HeroUI Native** - Beautiful, accessible React Native components
- **TanStack Query** - Powerful data fetching and caching for React
- **Turborepo** - Optimized monorepo build system
- **Bun** - Fast JavaScript runtime and package manager
- **Zod** - Runtime type validation
- **Zustand** - Lightweight state management
- **date-fns** - Date utility functions

## Project Structure

```
monthly-zen/
├── apps/
│   ├── web/              # TanStack Start web application
│   │   └── src/
│   │       ├── routes/   # File-based routing (calendar, dashboard, plans, settings, tasks)
│   │       ├── components/ui/  # Reusable UI components (shadcn-based)
│   │       ├── lib/      # Utilities and configurations
│   │       └── utils/    # API clients and helpers
│   ├── native/           # Expo React Native mobile app
│   │   └── app/
│   │       ├── (tabs)/   # Tab navigation screens (calendar, coaching, planner, profile, task)
│   │       ├── onboarding/  # Welcome, goals, and plan generation flow
│   │       ├── sign-in.tsx  # Authentication screens
│   │       └── components/  # Reusable components organized by feature
│   └── server/           # Hono backend server
│       └── src/
│           └── index.ts  # Server entry with auth routes and API mounting
├── packages/
│   ├── api/              # oRPC routers and business logic
│   │   └── src/routers/  # API endpoints (calendar, coaching, habits, plan, preferences, quota, resolutions, tasks, user)
│   ├── auth/             # Better-Auth configuration with Drizzle adapter and Expo plugin
│   ├── config/           # Shared TypeScript configuration
│   ├── db/               # Drizzle schema and database client
│   │   └── src/schema/   # Database tables (auth, coaching-insights, habits, monthly-plans, etc.)
│   ├── types/            # Shared TypeScript types
│   └── response-parser/  # AI response parsing utilities
└── docs/                 # Feature plans and technical documentation
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) runtime (v1.3.5+)
- PostgreSQL database
- OpenRouter API key (for AI features)
- Docker (for PostgreSQL container)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/monthly-zen.git
cd monthly-zen

# Install dependencies
bun install
```

### Database Setup

```bash
# Start PostgreSQL container
bun run db:start

# Push schema to database (development)
bun run db:push

# Or generate migrations and run them
bun run db:generate
bun run db:migrate
```

### Environment Configuration

Create `.env` files from the examples:

```bash
# Server environment
cp apps/server/.env.example apps/server/.env

# Web environment
cp apps/web/.env.example apps/web/.env

# Native environment
cp apps/native/.env.example apps/native/.env
```

**Server** (`apps/server/.env`):

| Variable                 | Description                                                      |
| ------------------------ | ---------------------------------------------------------------- |
| `DATABASE_URL`           | PostgreSQL connection string                                     |
| `BETTER_AUTH_SECRET`     | Secret for auth tokens (generate with `openssl rand -base64 32`) |
| `BETTER_AUTH_URL`        | Auth API URL (e.g., `http://localhost:3001`)                     |
| `OPENROUTER_API_KEY`     | OpenRouter API key for AI features                               |
| `OPENROUTER_MODEL`       | AI model to use (default: `anthropic/claude-3.5-sonnet`)         |
| `OPENROUTER_TEMPERATURE` | AI response creativity (default: `0.7`)                          |
| `OPENROUTER_MAX_TOKENS`  | AI response max tokens (default: `4000`)                         |
| `CORS_ORIGIN`            | Allowed CORS origin for web app                                  |

**Web** (`apps/web/.env`):

| Variable          | Description        |
| ----------------- | ------------------ |
| `VITE_SERVER_URL` | Backend server URL |

**Native** (`apps/native/.env`):

| Variable                 | Description                                                    |
| ------------------------ | -------------------------------------------------------------- |
| `EXPO_PUBLIC_SERVER_URL` | Backend server URL                                             |
| `APP_VARIANT`            | App variant: `development`, `preview`, or empty for production |

### Running the App

```bash
# Start all apps in development mode
bun run dev

# Or run individual apps:
bun run dev:web     # Web app at http://localhost:3000
bun run dev:server  # API server at http://localhost:3001
bun run dev:native  # Expo development server (requires native development tools)
```

### Database Commands

| Command               | Description                          |
| --------------------- | ------------------------------------ |
| `bun run db:start`    | Start PostgreSQL container           |
| `bun run db:stop`     | Stop PostgreSQL container            |
| `bun run db:down`     | Stop and remove PostgreSQL container |
| `bun run db:push`     | Push schema changes (development)    |
| `bun run db:generate` | Generate migration files             |
| `bun run db:migrate`  | Run database migrations              |
| `bun run db:studio`   | Open Drizzle Studio                  |
| `bun run db:watch`    | Watch for schema changes             |

## Available Scripts

| Command               | Description                               |
| --------------------- | ----------------------------------------- |
| `bun run dev`         | Start all applications                    |
| `bun run dev:web`     | Start web app only                        |
| `bun run dev:server`  | Start API server only                     |
| `bun run dev:native`  | Start Expo development server             |
| `bun run build`       | Build all applications                    |
| `bun run check-types` | TypeScript type checking                  |
| `bun run check`       | Run linter (oxlint) and formatter (oxfmt) |
| `bun run db:start`    | Start PostgreSQL container                |

## API Endpoints

The API uses oRPC for type-safe client-server communication. All routers are defined in `packages/api/src/routers/`.

| Router        | Description                                               |
| ------------- | --------------------------------------------------------- |
| `calendar`    | Monthly plan and task CRUD operations, calendar views     |
| `coaching`    | Coaching insights, pattern analysis, and goals management |
| `habits`      | Habit CRUD operations and tracking                        |
| `plan`        | Plan generation and regeneration                          |
| `preferences` | User preferences for planning and task complexity         |
| `quota`       | AI plan generation quota tracking                         |
| `resolutions` | Monthly resolutions and goals management                  |
| `tasks`       | Task CRUD, completion tracking, and pattern updates       |
| `user`        | User profile and pattern data                             |

### Example API Usage

```typescript
// Server-side (TanStack Start loaders)
import { orpc } from "@/utils/orpc";

const plans = await orpc.plan.getMyPlans.query();

// Client-side (React components with TanStack Query)
const query = orpc.coaching.getInsights.useQuery({ month: "2024-01" });

// Protected procedures (requires authentication)
await orpc.plan.generate.mutate({ preferences });
```

## Key Concepts

### Monthly Plans

A monthly plan is generated by AI based on:

- Your goals for the month
- Preferred task complexity (Simple, Balanced, Ambitious)
- Focus areas you want to prioritize
- Weekend work preferences
- Fixed commitments (meetings, appointments)
- Historical completion patterns

### Coaching Insights

AI-generated observations about your patterns:

- **Burnout Risk**: Detects overwork patterns before exhaustion
- **Week 3 Drop-off**: Identifies mid-month fatigue patterns
- **Peak Energy Day**: Your most productive day of the week
- **Declining Focus Areas**: Areas showing decreasing engagement
- **Maintenance Mode**: Suggested recovery weeks

### Habits

Daily habits that contribute to your monthly goals:

- Track completion across the month
- View streak and consistency statistics
- AI-generated habit recommendations
- Category-based organization

### App Variants

The native app supports multiple variants that can be installed simultaneously:

| Variant     | Bundle ID                                 | Display Name          |
| ----------- | ----------------------------------------- | --------------------- |
| Development | `com.thedevelophantom.monthlyzen.dev`     | Monthly Zen (Dev)     |
| Preview     | `com.thedevelophantom.monthlyzen.preview` | Monthly Zen (Preview) |
| Production  | `com.thedevelophantom.monthlyzen`         | Monthly Zen           |

## Architecture

### Authentication Flow

1. User signs up/in via web or mobile
2. Better-Auth creates session and stores in PostgreSQL
3. Session cookie enables authenticated API calls
4. oRPC `protectedProcedure` validates sessions

### Data Flow

1. User actions trigger oRPC procedure calls
2. Backend validates input with Zod schemas
3. Database operations via Drizzle ORM
4. AI features call OpenRouter API
5. Response parsed and returned to client

### Mobile Development

```bash
# Run on iOS simulator
bunx expo run:ios

# Run on Android emulator
bunx expo run:android

# Build for distribution
bunx eas build --profile development
bunx eas build --profile preview
bunx eas build --profile production
```

## Documentation

- [Feature Plans](./docs/) - Detailed feature specifications
- [API Documentation](./packages/api/) - oRPC router documentation
- [Database Schema](./packages/db/src/schema/) - Drizzle schema definitions
- [Authentication](./packages/auth/) - Better-Auth configuration

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run linting and formatting (`bun run check`)
5. Run type checking (`bun run check-types`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Style

- TypeScript strict mode enabled
- Run `bun run check` before committing
- oxlint enforces code quality
- oxfmt handles formatting

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
bun run db:stop && bun run db:start
```

### Authentication Errors

- Ensure `BETTER_AUTH_URL` matches your server URL
- Check CORS configuration in `CORS_ORIGIN`
- Verify database has auth tables (run `bun run db:push`)

### AI Features Not Working

- Verify `OPENROUTER_API_KEY` is set
- Check API key has sufficient credits
- Review server logs for OpenRouter errors

### Mobile App Issues

- Clear Metro cache: `bunx expo start --clear`
- Reinstall dependencies: `cd apps/native && bun install`
- Ensure `APP_VARIANT` is set correctly in `.env`

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- Report issues on [GitHub Issues](https://github.com/anomalyco/monthly-zen/issues)
- Check [docs](./docs/) for detailed guides
- Review [AGENTS.md](./AGENTS.md) for development guidelines
