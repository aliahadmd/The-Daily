# Tech Stack

## Framework & Runtime
- Next.js (latest) with App Router
- React 19
- TypeScript 5 (strict mode disabled)
- Node.js 24 LTS (or Bun as alternative runtime)

## Styling
- Tailwind CSS v4 via `@tailwindcss/postcss`
- Geist Sans and Geist Mono fonts via `next/font/google`
- CSS custom properties for theme colors (`--background`, `--foreground`)
- Dark mode via `prefers-color-scheme` media query

## Containerization
- Docker with multi-stage builds (dependencies → builder → runner)
- Next.js `output: "standalone"` for minimal production images
- Two Dockerfiles: `Dockerfile` (Node.js slim) and `Dockerfile.bun` (Bun)
- Docker Compose (`compose.yml`) with separate services for each runtime

## Common Commands

```bash
# Development
npm run dev        # Start dev server at http://localhost:3000

# Production build
npm run build      # Build Next.js app
npm start          # Start production server

# Docker (Node.js)
docker compose up nextjs-standalone --build

# Docker (Bun)
docker compose up nextjs-standalone-with-bun --build

# Docker (manual)
docker build -t nextjs-standalone-image .
docker run -p 3000:3000 nextjs-standalone-image
```

## Notes
- No test framework is configured
- Package manager: supports npm, yarn, or pnpm (detected via lockfile in Dockerfile)
- `pnpm-lock.yaml` is present, so pnpm is the primary package manager
