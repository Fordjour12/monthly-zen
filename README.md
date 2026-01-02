# Monthly Zen

Monthly Zen is an AI-powered habit coaching and monthly planning platform designed to help users build consistent habits, achieve their goals, and maintain productivity without burning out.

## What Monthly Zen Does

- **AI-Powered Monthly Planning**: Generate personalized monthly plans based on your goals, priorities, and schedule constraints
- **Habit Tracking**: Track task completion across the month with visual calendar and heatmap views
- **Predictive Coaching Insights**: AI analyzes your patterns to detect burnout risks, identify your most productive days, and suggest maintenance weeks before you hit a wall
- **Pattern Recognition**: Understand your weekly and monthly productivity rhythms through data-driven insights

## Features

### Core Functionality

- **Monthly Plan Generation**: AI creates balanced monthly plans considering your goals, focus areas, task complexity preferences, and fixed commitments
- **Habit & Task Management**: Daily task views with completion tracking, organized by week and focus area
- **Coaching Dashboard**: AI-generated insights about your productivity patterns, burnout risk, and personalized suggestions
- **Calendar Views**: Monthly calendar with heatmap visualization showing completion trends
- **Pattern Analytics**: Weekly completion patterns, day-of-week analysis, and focus area trends

### AI Coaching Features

- **Burnout Risk Detection**: Predictive alerts when your patterns suggest potential exhaustion
- **Maintenance Mode Suggestions**: AI recommends reduced-intensity weeks based on your historical data
- **Peak Energy Identification**: Identifies your most productive days and times
- **Declining Trend Alerts**: Warns when focus areas show decreasing completion rates
- **Actionable Insights**: Every insight includes a concrete suggested action you can accept, dismiss, or snooze

### Platforms

- **Web App**: Full-featured desktop experience with TanStack Start (React SSR)
- **Mobile App**: Native iOS and Android experience with Expo React Native

## Tech Stack

- **TypeScript** - Type safety throughout the codebase
- **TanStack Start** - SSR React framework with file-based routing
- **React Native + Expo** - Cross-platform mobile development
- **Hono + oRPC** - High-performance backend with end-to-end type-safe APIs
- **PostgreSQL + Drizzle ORM** - Type-safe database operations
- **Better-Auth** - Secure authentication with email/password
- **OpenRouter** - AI integration for plan generation and coaching insights
- **Tailwind CSS** - Utility-first styling (v4 for web, NativeWind for mobile)
- **HeroUI Native** - Beautiful, accessible React Native components
- **Turborepo** - Optimized monorepo build system
- **Bun** - Fast JavaScript runtime and package manager

## Project Structure

```
monthly-zen/
├── apps/
│   ├── web/              # TanStack Start web application
│   ├── native/           # Expo React Native mobile app
│   └── server/           # Hono backend server
├── packages/
│   ├── api/              # oRPC routers and business logic
│   ├── auth/             # Better-Auth configuration
│   ├── db/               # Drizzle schema and database queries
│   ├── types/            # Shared TypeScript types
│   └── response-parser/  # AI response parsing utilities
└── docs/                 # Feature plans and technical documentation
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) runtime
- PostgreSQL database
- OpenRouter API key (for AI features)

### Installation

```bash
# Install dependencies
bun install
```

### Database Setup

```bash
# Start PostgreSQL container
bun run db:start

# Push schema to database
bun run db:push
```

### Environment Configuration

Configure the following environment variables:

**Server** (`apps/server/.env`):

- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Secret for auth tokens
- `BETTER_AUTH_URL` - Auth API URL
- `OPENROUTER_API_KEY` - For AI plan generation
- `CORS_ORIGIN` - Web app URL

**Web** (`apps/web/.env`):

- `VITE_SERVER_URL` - Backend server URL

**Native** (`apps/native/.env`):

- `EXPO_PUBLIC_SERVER_URL` - Backend server URL
- `APP_VARIANT` - development/preview/production

### Running the App

```bash
# Start all apps in development mode
bun run dev

# Or run individual apps:
bun run dev:web     # Web app at http://localhost:3000
bun run dev:server  # API server at http://localhost:3001
bun run dev:native  # Expo dev server
```

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
| `bun run db:push`     | Push schema changes                       |
| `bun run db:studio`   | Open Drizzle Studio                       |

## API Endpoints

The API uses oRPC for type-safe client-server communication:

| Router     | Description                            |
| ---------- | -------------------------------------- |
| `calendar` | Monthly plan and task CRUD operations  |
| `coaching` | Coaching insights and goals management |
| `plans`    | Plan generation and preferences        |

## Key Concepts

### Monthly Plans

A monthly plan is generated by AI based on:

- Your goals for the month
- Preferred task complexity (Simple, Balanced, Ambitious)
- Focus areas you want to prioritize
- Weekend work preferences
- Fixed commitments (meetings, appointments)

### Coaching Insights

AI-generated observations about your patterns:

- **Burnout Risk**: Detects overwork patterns before exhaustion
- **Week 3 Drop-off**: Identifies mid-month fatigue patterns
- **Peak Energy Day**: Your most productive day of the week
- **Declining Focus Areas**: Areas showing decreasing engagement
- **Maintenance Mode**: Suggested recovery weeks

### Maintenance Mode

When AI detects burnout risk or recurring drop-offs, it can suggest "Maintenance Mode" weeks with:

- Reduced task load
- More rest-focused activities
- Flexible scheduling

## Documentation

- [Feature Plans](./docs/) - Detailed feature specifications
- [API Documentation](./packages/api/) - oRPC router documentation
- [Database Schema](./packages/db/src/schema/) - Drizzle schema definitions

## License

MIT
