# Quran Memorizer

A web application to help Hifz students memorize the Holy Quran through interactive tools including text display, audio recitation, progress tracking, and self-testing features.

## About

Quran Memorizer is designed for individual Hifz students to track and enhance their Quran memorization journey. The application provides a clean, distraction-free interface for reading Quranic text, listening to recitations, tracking progress, and testing retention through quiz mode.

## Features

### Implemented ✅

| Feature | Description |
|---------|-------------|
| **User Authentication** | Email/password registration and login, OAuth (Google, GitHub) support, secure session management with Better Auth, real-time auth state management |
| **Dashboard** | Progress overview with statistics, quick access to reading and quiz modes, clean responsive UI with dark theme |

### Planned 🚧

| Feature | Description |
|---------|-------------|
| **Quran Reading** | Display Quranic text in Arabic (Uthmani script), surah and ayah navigation, clean distraction-free reading interface, juz indicators |
| **Audio Recitation** | Integrated audio playback from reputable reciters, single ayah repeat, range repeat with custom count, playback controls (play, pause, seek) |
| **Progress Tracking** | Mark ayahs as: Not Started, In Progress, Memorized, Revised, visual progress indicators (progress bars, color coding), track completed Surahs and Juz, streak tracking |
| **Quiz/Self-Testing Mode** | Hide text for memory recitation, hint system (reveal first letter/word), self-assessment tracking, test by surah, juz, or custom range |

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) - Full-stack React framework
- **UI**: React 19, Tailwind CSS v4
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Better Auth](https://www.better-auth.com/)
- **State Management**: TanStack Query
- **Routing**: TanStack Router (file-based routing)

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm/yarn
- PostgreSQL database

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd memorizer
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Update .env files

### 4. Set up the database

Create a PostgreSQL database and user:

```bash
# Using psql
psql -U postgres

CREATE DATABASE memorizer;
CREATE USER 'user' WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE memorizer TO 'user';
\q
```

### 5. Push database schema

```bash
pnpm db:push
```

### 6. Start the development server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Docker Deployment

The easiest way to run Quran Memorizer is using Docker. This includes everything needed (application + PostgreSQL database) in a single command.

### Quick Start with Docker Compose

1. **Clone and navigate to the project**

```bash
git clone <repository-url>
cd memorizer
```

2. **Create environment file** (optional)

Create a `.env` file or use the default values:

```env
# Database (defaults shown)
POSTGRES_USER=memorizer
POSTGRES_PASSWORD=memorizer123
POSTGRES_DB=memorizer

# Better Auth
BETTER_AUTH_URL=http://localhost:3000

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback/google

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:3000/auth/callback/github
```

3. **Run with Docker Compose**

```bash
docker-compose up -d
```

This will:
- Start PostgreSQL in an optimized container
- Build and start the application
- Automatically wait for the database to be healthy
- Run database migrations

4. **Access the application**

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Commands

| Command | Description |
|---------|-------------|
| `docker-compose up -d` | Start all services in detached mode |
| `docker-compose down` | Stop all services |
| `docker-compose logs -f app` | View application logs |
| `docker-compose exec app sh` | Access application container shell |
| `docker-compose ps` | Show running services |
| `docker-compose up -d --build` | Rebuild and restart services |

### Running Database Migrations

First-time setup runs migrations automatically. To run migrations manually:

```bash
docker-compose --profile migration up migrate
```

### Production Deployment

For production deployment:

1. Update `BETTER_AUTH_URL` in `.env` to your production domain
2. Update OAuth redirect URIs to match your domain
3. Use strong database passwords
4. Consider using Docker secrets or environment vault for sensitive data

```bash
docker-compose -f docker-compose.yml --profile production up -d
```

### Docker Optimization

The Docker setup is optimized for:
- **Small image size**: Multi-stage build with Debian slim (~250MB final image)
- **Fast builds**: Layer caching for dependencies
- **Security**: Non-root user, minimal attack surface
- **Health checks**: Automatic container restart on failure
- **Compatibility**: Uses glibc (standard) instead of musl, avoiding DNS resolution issues

## Project Structure

```
memorizer/
├── src/
│   ├── routes/              # TanStack Start file-based routing
│   │   ├── __root.tsx       # Root layout with providers
│   │   ├── index.tsx        # Home page
│   │   ├── dashboard.tsx    # User dashboard
│   │   ├── api/             # API routes
│   │   │   └── auth/$.tsx   # Better Auth endpoints
│   │   └── auth/            # Auth pages
│   │       ├── login.tsx
│   │       └── register.tsx
│   ├── components/          # React components
│   │   ├── Header.tsx
│   │   └── HeaderAuth.tsx
│   ├── lib/                 # Utilities & configurations
│   │   ├── auth.ts          # Better Auth server config
│   │   └── auth-client.ts   # Better Auth React client
│   ├── db/                  # Database setup
│   │   ├── index.ts         # Database connection
│   │   └── schema.ts        # Drizzle schema
│   └── styles.css           # Global styles
├── tests/
│   └── e2e/                 # E2E tests with Playwright
│       ├── auth.spec.ts     # Authentication tests
│       ├── dashboard.spec.ts # Dashboard tests
│       └── home.spec.ts     # Home page tests
├── docs/
│   └── initial_prd.md       # Product Requirements Document
├── Dockerfile               # Multi-stage Docker build
├── docker-compose.yml       # Docker Compose configuration
├── .dockerignore            # Docker build exclusions
├── playwright.config.ts     # Playwright E2E test configuration
└── drizzle.config.ts        # Drizzle ORM configuration
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm db:generate` | Generate database migrations |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:push` | Push schema changes to database |
| `pnpm db:studio` | Open Drizzle Studio (database GUI) |
| `pnpm test:e2e` | Run E2E tests with Playwright |
| `pnpm test:e2e:ui` | Run E2E tests with Playwright UI |
| `pnpm test:e2e:headed` | Run E2E tests in headed mode |
| `pnpm test:e2e:debug` | Debug E2E tests with Playwright |

## Testing

This project uses [Playwright](https://playwright.dev/) for end-to-end testing. All existing features are covered by automated tests.

### Test Structure

```
tests/e2e/
├── auth.spec.ts      # Authentication tests (register, login, logout)
├── dashboard.spec.ts # Dashboard tests
└── home.spec.ts      # Home page tests
```

### Running Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run tests with UI mode (interactive)
pnpm test:e2e:ui

# Run tests in headed mode (see browser)
pnpm test:e2e:headed

# Debug tests
pnpm test:e2e:debug
```

### Test Coverage

Current E2E test coverage:

| Feature | Tests |
|---------|-------|
| **Authentication** | Registration validation, email validation, password strength, login, logout, session persistence |
| **Dashboard** | Progress cards, quick actions, navigation, auth requirements |
| **Home Page** | Navigation links, styling, authenticated vs unauthenticated state |

### Development Workflow

Before implementing new features:

1. **Write tests first** for the new feature
2. **Run tests** to verify they fail (red)
3. **Implement the feature**
4. **Run tests** to verify they pass (green)
5. **Refactor** if needed

This ensures every feature is tested before moving on to the next implementation.

### Test Reports

After running tests, an HTML report is generated:

```bash
pnpm test:e2e
# View report
npx playwright show-report
```

## Roadmap

See [docs/initial_prd.md](docs/initial_prd.md) for the complete Product Requirements Document.

### Implementation Priority

| Priority | Feature | Status |
|----------|---------|--------|
| P0 | User Authentication | ✅ Done |
| P0 | Quran Text Display | 🚧 Planned |
| P0 | Basic Progress Tracking | 🚧 Planned |
| P1 | Audio Playback | 🚧 Planned |
| P1 | Quiz Mode | 🚧 Planned |
| P2 | Advanced Progress Features | 📋 Backlog |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgments

- Quran text data will be sourced from [Quran.com API](https://quran.com/docs) or [Alquran.cloud](https://alquran.cloud/)
- Audio recitations from reputable reciters (to be integrated)
- Built with [TanStack Start](https://tanstack.com/start)
