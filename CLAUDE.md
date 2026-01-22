# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quran Memorizer is a full-stack web application for Hifz students to track and enhance their Quran memorization journey. It provides Quran text display, audio recitation, progress tracking, and quiz/self-testing modes.

## Tech Stack

- **TanStack Start** - Full-stack React framework with file-based routing, SSR/SSG support
- **React 19** with **TypeScript**
- **Vite** - Build tool and dev server
- **Tailwind CSS v4** - Styling
- **PostgreSQL** with **Drizzle ORM** - Database
- **Better Auth** - Authentication (email/password + OAuth with Google/GitHub)
- **TanStack Query** - Server state management and caching
- **Playwright** - E2E testing

## Commands

### Development
```bash
pnpm dev              # Start dev server on port 3000
pnpm build            # Build for production
pnpm preview          # Preview production build
```

### Database
```bash
pnpm db:generate      # Generate database migrations from schema changes
pnpm db:migrate       # Run pending migrations
pnpm db:push          # Push schema directly to database (for prototyping)
pnpm db:studio        # Open Drizzle Studio (database GUI)
```

### Testing
```bash
pnpm test             # Run unit tests (Vitest)
pnpm test:e2e         # Run E2E tests (Playwright)
pnpm test:e2e:ui      # Run E2E tests with UI
pnpm test:e2e:headed  # Run E2E tests in headed mode
pnpm test:e2e:debug   # Debug E2E tests
```

## Architecture

### File-Based Routing (TanStack Router)

Routes are defined in `src/routes/` using TanStack Start's file-based routing:

- `__root.tsx` - Root layout with providers (QueryClient, Header, DevTools)
- `index.tsx` - Home page
- `dashboard.tsx` - User dashboard (requires auth)
- `auth/login.tsx`, `auth/register.tsx` - Authentication pages
- `api/auth/$.tsx` - Better Auth API endpoints

**Key pattern**: All server-side code (database queries, API calls) should live in route `loader` functions. Client components consume data via `useLoader()` hook.

### Database Schema (`src/db/schema.ts`)

Tables managed by Drizzle ORM:
- `user` - User accounts (Better Auth schema)
- `session` - User sessions for authentication
- `account` - OAuth provider accounts
- `verification` - Email verification tokens
- `progress` - Memorization progress (surahNumber, ayahNumber, status)

Progress status values: `'not_started'`, `'in_progress'`, `'memorized'`, `'revised'`

### Authentication (Better Auth)

Server config: `src/lib/auth.ts`
Client config: `src/lib/auth-client.ts`

Auth features:
- Email/password with optional email verification
- OAuth (Google, GitHub)
- Session-based auth with 7-day expiration
- Cookie-based session caching (5 minutes)

**Important**: Environment variables required for OAuth:
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_REDIRECT_URI`
- `BETTER_AUTH_URL` (default: `http://localhost:3000`)
- `DATABASE_URL` (default: `postgresql://localhost:5433/memorizer`)

### Docker Development

```bash
docker-compose up -d   # Start app + PostgreSQL
```

The Docker setup runs PostgreSQL on port 5433 (not 5432) to avoid conflicts. The app auto-runs migrations on startup.

## Implementation Priorities (from PRD)

| Priority | Feature |
|----------|---------|
| P0 | User Authentication (completed) |
| P0 | Quran Text Display |
| P0 | Basic Progress Tracking |
| P1 | Audio Playback |
| P1 | Quiz Mode |
| P2 | Advanced Progress Features (dashboard, analytics) |

## Code Conventions

- Use `@/*` path alias for imports from `src/`
- Dark theme with Tailwind's slate color palette
- Mobile-first responsive design
- All new database changes require running `pnpm db:generate` and `pnpm db:migrate`
