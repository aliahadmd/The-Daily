# Project Structure

```
/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout, fonts, metadata
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles + Tailwind import
├── public/                 # Static assets served at /
├── Dockerfile              # Multi-stage build (Node.js)
├── Dockerfile.bun          # Multi-stage build (Bun)
├── compose.yml             # Docker Compose (two services)
├── next.config.ts          # Next.js config (standalone output)
├── postcss.config.js       # Tailwind CSS PostCSS plugin
├── tsconfig.json           # TypeScript config
└── package.json            # Scripts and dependencies
```

## Conventions

- All pages and layouts live under `app/` using the App Router file conventions
- New routes are added as folders with `page.tsx` inside `app/`
- Shared UI components should go in `components/` (not yet created)
- Shared utilities/helpers should go in `lib/` (not yet created)
- Static files go in `public/` and are referenced from the root path (e.g. `/next.svg`)
- Metadata is exported from `layout.tsx` or individual `page.tsx` files using the Next.js `Metadata` type
- Fonts are loaded via `next/font/google` and applied as CSS variables on `<body>`
- Tailwind classes are used for all styling; avoid inline styles and separate CSS modules unless necessary
