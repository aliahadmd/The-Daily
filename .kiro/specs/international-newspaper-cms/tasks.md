# Tasks

## Task List

- [x] 1 Project Setup and Infrastructure
  - [x] 1.1 Install dependencies: drizzle-orm, drizzle-kit, pg, @aws-sdk/client-s3, bcryptjs, iron-session, remark, rehype, fast-check, vitest
  - [x] 1.2 Update compose.yml to add PostgreSQL 16-alpine, MinIO, and migration services with health checks and depends_on
  - [x] 1.3 Add environment variable definitions to compose.yml (DATABASE_URL, MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, SESSION_SECRET)
  - [x] 1.4 Update next.config.ts to configure allowed image domains for MinIO
  - [x] 1.5 Update app/globals.css with cream/black theme CSS custom properties and Tailwind v4 theme tokens
  - [x] 1.6 Configure Vitest (vitest.config.ts) and add test script to package.json

- [x] 2 Database Schema and Migrations
  - [x] 2.1 Create lib/db/schema.ts with all Drizzle table definitions (admins, categories, tags, countries, media, articles, article_tags, video_posts, video_post_tags, publication_status enum)
  - [x] 2.2 Create lib/db/index.ts with the Drizzle + postgres client singleton
  - [x] 2.3 Create drizzle.config.ts pointing to lib/db/schema.ts and migrations directory
  - [x] 2.4 Run drizzle-kit generate to produce the initial migration file
  - [x] 2.5 Create a migration entrypoint script (scripts/migrate.ts) that runs drizzle migrate and seeds the initial admin account from environment variables

- [x] 3 Core Library Utilities
  - [x] 3.1 Create lib/slugify.ts — slugify function that produces lowercase alphanumeric + hyphen strings
  - [x] 3.2 Create lib/markdown.ts — renderMarkdown(md: string): string using remark + rehype-stringify supporting all required block types
  - [x] 3.3 Create lib/auth.ts — hashPassword, verifyPassword (bcrypt, cost 12), getSession, createSession, destroySession using iron-session
  - [x] 3.4 Create lib/minio.ts — MinIO S3 client, uploadFile(type, slug, file) returning { url, storagePath }, deleteFile(storagePath), validateUpload(mimeType, sizeBytes, accept)
  - [x] 3.5 Write property-based tests for lib/slugify.ts (Property 19)
  - [x] 3.6 Write property-based tests for lib/markdown.ts (Property 5)
  - [x] 3.7 Write property-based tests for lib/auth.ts (Properties 12, 13)
  - [x] 3.8 Write property-based tests for lib/minio.ts validateUpload (Property 17)

- [x] 4 Database Query Functions
  - [x] 4.1 Create lib/queries/articles.ts — getBreakingNews, getFeaturedArticles, getLatestArticles, getArticlesByCategory, getArticlesByCountry, getArticleBySlug, getRelatedArticles, createArticle, updateArticle, deleteArticle, publishArticle, archiveArticle
  - [x] 4.2 Create lib/queries/taxonomy.ts — getCategories, getCategoryBySlug, getTags, getTagBySlug, getCountries, getCountryBySlug, createCategory, updateCategory, deleteCategory, createTag, updateTag, deleteTag, createCountry, updateCountry, deleteCountry
  - [x] 4.3 Create lib/queries/videos.ts — getVideosByLatest, getVideoPostBySlug, createVideoPost, updateVideoPost, deleteVideoPost
  - [x] 4.4 Create lib/queries/search.ts — searchArticles(query, page) using PostgreSQL full-text search (to_tsvector / plainto_tsquery)
  - [x] 4.5 Create lib/queries/media.ts — createMediaRecord, deleteMediaRecord, listMedia
  - [x] 4.6 Write unit + property tests for article queries (Properties 1, 2, 3, 4, 6, 7, 15, 16)
  - [x] 4.7 Write unit + property tests for taxonomy queries (Properties 8, 9, 20)
  - [x] 4.8 Write unit + property tests for search queries (Property 10)

- [x] 5 Admin Authentication
  - [x] 5.1 Create app/admin/login/page.tsx — login form (username + password, error display)
  - [x] 5.2 Create app/api/admin/auth/login/route.ts — POST handler: verify credentials, create iron-session cookie, redirect to /admin
  - [x] 5.3 Create app/api/admin/auth/logout/route.ts — POST handler: destroy session, redirect to /admin/login
  - [x] 5.4 Create middleware.ts — protect all /admin/* routes (except /admin/login), redirect unauthenticated requests
  - [x] 5.5 Write unit tests for auth middleware (Property 11)

- [x] 6 Admin API Routes
  - [x] 6.1 Create app/api/admin/upload/route.ts — POST: validate file, upload to MinIO, insert media record, return { url, mediaId }
  - [x] 6.2 Create app/api/admin/articles/route.ts — GET: list all articles; POST: create article with validation
  - [x] 6.3 Create app/api/admin/articles/[id]/route.ts — PUT: update article; DELETE: delete article + media cleanup
  - [x] 6.4 Create app/api/admin/videos/route.ts — GET: list video posts; POST: create video post
  - [x] 6.5 Create app/api/admin/videos/[id]/route.ts — PUT: update; DELETE: delete + media cleanup
  - [x] 6.6 Create app/api/admin/media/[id]/route.ts — DELETE: remove from MinIO + DB
  - [x] 6.7 Create app/api/admin/categories/route.ts — GET/POST
  - [x] 6.8 Create app/api/admin/categories/[id]/route.ts — PUT/DELETE (with article-count guard)
  - [x] 6.9 Create app/api/admin/tags/route.ts — GET/POST
  - [x] 6.10 Create app/api/admin/tags/[id]/route.ts — PUT/DELETE (cascade disassociate)
  - [x] 6.11 Create app/api/admin/countries/route.ts — GET/POST
  - [x] 6.12 Create app/api/admin/countries/[id]/route.ts — PUT/DELETE (with article-count guard)

- [x] 7 Public Components
  - [x] 7.1 Create components/public/NavBar.tsx — newspaper name, category links, search input
  - [x] 7.2 Create components/public/Footer.tsx — category links, tags index link, countries index link
  - [x] 7.3 Create components/public/ArticleCard.tsx — supports "featured", "compact", "default" variants with cover image, title, excerpt, category, date
  - [x] 7.4 Create components/public/BreakingNewsTicker.tsx — horizontal scrolling ticker for breaking news titles/slugs
  - [x] 7.5 Create components/public/VideoCard.tsx — cover image, title, slug link
  - [x] 7.6 Create components/public/Pagination.tsx — prev/next + page number controls

- [x] 8 Public Pages
  - [x] 8.1 Update app/layout.tsx — integrate NavBar, Footer, cream/black theme, Geist fonts
  - [x] 8.2 Create app/page.tsx — SSR homepage: Breaking News ticker, Today's Features (5), Latest News (10), By Category rows (4 each), World News blocks (3 each), Videos section (4)
  - [x] 8.3 Create app/articles/[slug]/page.tsx — ISR (60s): article title, cover image, author, date, category, country, tags, rendered Markdown body, video embed/player, related articles (4), OG meta tags, JSON-LD NewsArticle
  - [x] 8.4 Create app/categories/[slug]/page.tsx — ISR (60s): category header (name, description, count), paginated article list (20/page)
  - [x] 8.5 Create app/tags/[slug]/page.tsx — ISR (60s): tag header (name, count), paginated article list
  - [x] 8.6 Create app/countries/[slug]/page.tsx — ISR (60s): country header (name, ISO code, count), paginated article list
  - [x] 8.7 Create app/videos/[slug]/page.tsx — ISR (60s): video player (HTML5 or iframe), title, description, cover image, category, tags
  - [x] 8.8 Create app/search/page.tsx — SSR: search results with total count, "no results" message
  - [x] 8.9 Create app/sitemap.ts — Next.js sitemap generator listing all published articles, categories, tags, countries (ISR 3600s)
  - [x] 8.10 Create app/robots.ts — Next.js robots.txt generator allowing all crawlers, referencing sitemap

- [x] 9 Admin UI Components
  - [x] 9.1 Create components/admin/MarkdownEditor.tsx — Notion-style block editor (use @uiw/react-md-editor or BlockNote) supporting H1-H3, paragraphs, bold, italic, blockquotes, lists, code, image insertion with MinIO upload
  - [x] 9.2 Create components/admin/MediaUpload.tsx — drag-and-drop file upload component calling /api/admin/upload, shows preview thumbnail
  - [x] 9.3 Create components/admin/ArticleForm.tsx — full article editor form: all fields, slug auto-generation from title, validation error display
  - [x] 9.4 Create components/admin/VideoPostForm.tsx — video post editor form: all fields, embed URL or file upload toggle
  - [x] 9.5 Create components/admin/TaxonomyForm.tsx — reusable form for category/tag/country CRUD

- [x] 10 Admin Pages
  - [x] 10.1 Create app/admin/layout.tsx — admin shell layout with sidebar navigation (articles, videos, media, categories, tags, countries, logout)
  - [x] 10.2 Create app/admin/page.tsx — dashboard overview with counts (articles, videos, media, categories, tags, countries)
  - [x] 10.3 Create app/admin/articles/page.tsx — paginated article list table (title, category, status, author, date, edit/delete actions)
  - [x] 10.4 Create app/admin/articles/new/page.tsx — new article page using ArticleForm
  - [x] 10.5 Create app/admin/articles/[id]/edit/page.tsx — edit article page using ArticleForm pre-populated
  - [x] 10.6 Create app/admin/videos/page.tsx — video post list table
  - [x] 10.7 Create app/admin/videos/new/page.tsx — new video post using VideoPostForm
  - [x] 10.8 Create app/admin/videos/[id]/edit/page.tsx — edit video post using VideoPostForm
  - [x] 10.9 Create app/admin/media/page.tsx — media library grid with filename, type, size, upload date, image thumbnails, delete button
  - [x] 10.10 Create app/admin/categories/page.tsx — category list with inline create/edit/delete using TaxonomyForm
  - [x] 10.11 Create app/admin/tags/page.tsx — tag list with inline CRUD
  - [x] 10.12 Create app/admin/countries/page.tsx — country list with inline CRUD (name, ISO code)

- [x] 11 Property-Based Tests
  - [x] 11.1 Write property test for Property 1: breaking news query ordering and filtering
  - [x] 11.2 Write property test for Property 2: homepage section N-limit queries
  - [x] 11.3 Write property test for Property 3: only published articles in public queries
  - [x] 11.4 Write property test for Property 6: related articles exclude current and respect category
  - [x] 11.5 Write property test for Property 7: missing/non-published slug returns null
  - [x] 11.6 Write property test for Property 8: taxonomy index pagination correctness
  - [x] 11.7 Write property test for Property 14: article save validation rejects incomplete records
  - [x] 11.8 Write property test for Property 18: media stored at correct MinIO path pattern
  - [x] 11.9 Write property test for Property 21: video post render type matches source type
  - [x] 11.10 Write property test for Property 22: sitemap contains all published content URLs
  - [x] 11.11 Write property test for Property 23: JSON-LD structured data contains required fields
