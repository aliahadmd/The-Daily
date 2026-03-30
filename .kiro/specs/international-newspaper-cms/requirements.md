# Requirements Document

## Introduction

An international newspaper platform with a full-featured CMS. The system serves readers a rich, decorated homepage with breaking news, featured stories, category-based sections, and country-based news. Editors and admins manage all content through a secure CMS with CRUD capabilities. The platform supports articles, videos, images, categories, tags, and country-based organization. The UI follows a minimalist cream-and-black aesthetic, is fully mobile-responsive, and runs entirely in Docker Compose containers.

## Glossary

- **CMS**: Content Management System — the admin interface for creating, reading, updating, and deleting all content
- **Article**: A piece of editorial content consisting of a title, body (Markdown), cover image, category, tags, country, author, and publication status
- **Breaking_News**: A high-priority article flagged for prominent display at the top of the homepage
- **Featured_Article**: An article manually selected for display in the "Today's Features" section of the homepage
- **Category**: A top-level editorial classification for articles (e.g., Politics, Business, Technology, Sports, Culture)
- **Tag**: A free-form keyword attached to one or more articles for cross-cutting discovery
- **Country**: A geographic entity used to group and filter articles by region or nation
- **Video**: A media asset (uploaded file or external embed URL) attached to an article or published as a standalone video post
- **Cover_Image**: The primary image associated with an article or video post, stored in MinIO
- **Media**: Any uploaded file (image, video) stored in MinIO S3-compatible object storage
- **Admin**: An authenticated user with full CMS access to create, edit, publish, and delete all content
- **Reader**: An unauthenticated or authenticated visitor who browses and reads published content
- **Homepage**: The public-facing root page (`/`) of the newspaper
- **CMS_Dashboard**: The admin-only area at `/admin` for managing all content
- **Drizzle**: The ORM used to define the database schema and run queries against PostgreSQL
- **MinIO**: The S3-compatible object storage service used for all media uploads
- **Markdown_Editor**: A Notion-style block-based rich text editor used in the CMS for article body content
- **Slug**: A URL-safe, human-readable identifier derived from a title, used in article and category URLs
- **Publication_Status**: The state of an article — one of `draft`, `published`, or `archived`

---

## Requirements

### Requirement 1: Public Homepage

**User Story:** As a Reader, I want to see a rich, decorated homepage with breaking news, featured stories, category sections, and country news, so that I can quickly discover the most important and relevant stories.

#### Acceptance Criteria

1. THE Homepage SHALL display a Breaking News ticker or banner showing the titles and slugs of all articles flagged as Breaking_News, ordered by publication date descending.
2. THE Homepage SHALL display a "Today's Features" section showing up to 5 Featured_Articles with their Cover_Image, title, category, and excerpt.
3. THE Homepage SHALL display a "Latest News" section showing the 10 most recently published Articles across all categories.
4. THE Homepage SHALL display a "By Category" section rendering one horizontal card row per Category, each showing up to 4 of the most recent published Articles in that Category.
5. THE Homepage SHALL display a "World News" section rendering one block per Country that has at least one published Article, showing up to 3 Articles per Country.
6. THE Homepage SHALL display a top navigation bar containing the newspaper name, links to all Categories, and a search input.
7. THE Homepage SHALL display a footer containing links to Categories, Tags index, and Country index pages.
8. WHEN a Reader clicks an Article card, THE Homepage SHALL navigate the Reader to the Article detail page at `/articles/[slug]`.
9. WHEN no Breaking_News articles exist, THE Homepage SHALL hide the Breaking News banner entirely.
10. THE Homepage SHALL render correctly on viewport widths from 320px to 2560px using responsive Tailwind CSS classes.

---

### Requirement 2: Article Detail Page

**User Story:** As a Reader, I want to read a full article with its cover image, body, metadata, and related content, so that I can consume the complete story.

#### Acceptance Criteria

1. WHEN a Reader navigates to `/articles/[slug]`, THE Article_Page SHALL display the article's title, Cover_Image, author name, publication date, Category, Country, and Tags.
2. THE Article_Page SHALL render the article body from stored Markdown into HTML, supporting headings, paragraphs, bold, italic, blockquotes, ordered lists, unordered lists, inline code, and code blocks.
3. WHEN an article has an associated Video, THE Article_Page SHALL embed the video player below the Cover_Image.
4. THE Article_Page SHALL display a "Related Articles" section showing up to 4 Articles sharing the same Category, excluding the current article.
5. IF a Reader navigates to `/articles/[slug]` for a slug that does not exist or is not published, THEN THE Article_Page SHALL return a 404 response.
6. THE Article_Page SHALL include Open Graph meta tags (`og:title`, `og:description`, `og:image`) populated from the article's title, excerpt, and Cover_Image URL.

---

### Requirement 3: Category, Tag, and Country Index Pages

**User Story:** As a Reader, I want to browse articles filtered by category, tag, or country, so that I can find stories relevant to my interests or region.

#### Acceptance Criteria

1. WHEN a Reader navigates to `/categories/[slug]`, THE Category_Page SHALL display all published Articles belonging to that Category, ordered by publication date descending, paginated at 20 articles per page.
2. WHEN a Reader navigates to `/tags/[slug]`, THE Tag_Page SHALL display all published Articles associated with that Tag, ordered by publication date descending, paginated at 20 articles per page.
3. WHEN a Reader navigates to `/countries/[slug]`, THE Country_Page SHALL display all published Articles associated with that Country, ordered by publication date descending, paginated at 20 articles per page.
4. THE Category_Page SHALL display the Category name, description, and article count at the top of the page.
5. THE Tag_Page SHALL display the Tag name and article count at the top of the page.
6. THE Country_Page SHALL display the Country name, flag emoji or code, and article count at the top of the page.
7. IF a Reader navigates to a category, tag, or country slug that does not exist, THEN THE System SHALL return a 404 response.
8. WHEN a page has more than 20 articles, THE System SHALL render pagination controls allowing the Reader to navigate between pages.

---

### Requirement 4: Search

**User Story:** As a Reader, I want to search for articles by keyword, so that I can find specific stories quickly.

#### Acceptance Criteria

1. WHEN a Reader submits a search query via the navigation search input, THE Search_Page SHALL display all published Articles whose title or body contains the query string, ordered by relevance.
2. THE Search_Page SHALL display the total count of results and the search query at the top of the results list.
3. WHEN a search query returns no results, THE Search_Page SHALL display a "No results found" message.
4. THE Search_Page SHALL be accessible at `/search?q=[query]`.

---

### Requirement 5: Admin Authentication

**User Story:** As an Admin, I want to log in with a username and password, so that I can access the CMS securely.

#### Acceptance Criteria

1. THE CMS_Dashboard SHALL be accessible only to authenticated Admin users; all `/admin/*` routes SHALL redirect unauthenticated requests to `/admin/login`.
2. WHEN an Admin submits valid credentials on the login page, THE Auth_System SHALL create a secure HTTP-only session cookie and redirect the Admin to `/admin`.
3. IF an Admin submits invalid credentials, THEN THE Auth_System SHALL display an error message and SHALL NOT create a session.
4. WHEN an Admin clicks "Log out", THE Auth_System SHALL invalidate the session cookie and redirect the Admin to `/admin/login`.
5. THE Auth_System SHALL store Admin passwords as bcrypt hashes with a minimum cost factor of 12; plaintext passwords SHALL NOT be stored.
6. THE Auth_System SHALL support seeding at least one Admin account via an environment variable or migration script.

---

### Requirement 6: Article Management (CMS)

**User Story:** As an Admin, I want to create, edit, publish, archive, and delete articles through the CMS, so that I can manage all editorial content.

#### Acceptance Criteria

1. THE CMS_Dashboard SHALL display a paginated list of all Articles (all statuses) showing title, category, status, author, and publication date.
2. WHEN an Admin creates a new article, THE Article_Editor SHALL provide fields for: title, Slug (auto-generated from title, editable), excerpt, body (Markdown_Editor), Cover_Image upload, Category (select), Tags (multi-select), Country (select), Video (optional upload or embed URL), Publication_Status, and publication date.
3. WHEN an Admin saves an article, THE Article_Editor SHALL validate that title, body, category, and slug are non-empty before persisting.
4. IF an Admin saves an article with a slug that already exists for a different article, THEN THE Article_Editor SHALL display a validation error and SHALL NOT persist the duplicate slug.
5. WHEN an Admin publishes an article, THE System SHALL set the Publication_Status to `published` and record the publication timestamp.
6. WHEN an Admin archives an article, THE System SHALL set the Publication_Status to `archived`; archived articles SHALL NOT appear on public-facing pages.
7. WHEN an Admin deletes an article, THE System SHALL permanently remove the article record and its associated Media references from the database; stored Media files in MinIO SHALL be deleted.
8. THE Markdown_Editor SHALL support a Notion-style block-based editing experience with support for: headings (H1–H3), paragraphs, bold, italic, blockquotes, ordered lists, unordered lists, inline code, code blocks, and image insertion.
9. WHEN an Admin inserts an image into the Markdown_Editor body, THE System SHALL upload the image to MinIO and insert the resulting URL into the Markdown content.

---

### Requirement 7: Media Management (CMS)

**User Story:** As an Admin, I want to upload and manage images and videos through the CMS, so that I can attach rich media to articles.

#### Acceptance Criteria

1. WHEN an Admin uploads a Cover_Image, THE Media_Service SHALL store the file in MinIO under a structured path (`/covers/{article-slug}/{filename}`) and return a publicly accessible URL.
2. WHEN an Admin uploads a Video file, THE Media_Service SHALL store the file in MinIO under `/videos/{article-slug}/{filename}` and return a publicly accessible URL.
3. THE Media_Service SHALL accept image uploads in JPEG, PNG, WebP, and GIF formats with a maximum file size of 20 MB per file.
4. THE Media_Service SHALL accept video uploads in MP4 and WebM formats with a maximum file size of 500 MB per file.
5. IF an uploaded file exceeds the maximum allowed size, THEN THE Media_Service SHALL reject the upload and return a descriptive error message.
6. IF an uploaded file has an unsupported MIME type, THEN THE Media_Service SHALL reject the upload and return a descriptive error message.
7. THE CMS_Dashboard SHALL include a Media Library page listing all uploaded Media assets with their filename, type, size, upload date, and a preview thumbnail for images.
8. WHEN an Admin deletes a Media asset from the Media Library, THE Media_Service SHALL remove the file from MinIO and remove the Media record from the database.

---

### Requirement 8: Category, Tag, and Country Management (CMS)

**User Story:** As an Admin, I want to create, edit, and delete categories, tags, and countries through the CMS, so that I can organize content taxonomy.

#### Acceptance Criteria

1. THE CMS_Dashboard SHALL provide CRUD interfaces for Categories, Tags, and Countries.
2. WHEN an Admin creates a Category, THE System SHALL require a name and auto-generate a Slug; an optional description field SHALL be provided.
3. WHEN an Admin creates a Tag, THE System SHALL require a name and auto-generate a Slug.
4. WHEN an Admin creates a Country, THE System SHALL require a name, a two-letter ISO 3166-1 alpha-2 code, and auto-generate a Slug.
5. IF an Admin attempts to delete a Category that has one or more associated Articles, THEN THE System SHALL display a warning and require confirmation before deletion.
6. IF an Admin attempts to delete a Country that has one or more associated Articles, THEN THE System SHALL display a warning and require confirmation before deletion.
7. WHEN an Admin deletes a Tag, THE System SHALL remove the Tag and disassociate it from all Articles without deleting those Articles.

---

### Requirement 9: Video Posts (CMS & Public)

**User Story:** As an Admin, I want to publish standalone video posts, and as a Reader, I want to watch videos on a dedicated video page, so that video content is a first-class content type.

#### Acceptance Criteria

1. THE CMS_Dashboard SHALL provide a Video_Post editor with fields for: title, Slug, description, Cover_Image, video file upload or embed URL (YouTube/Vimeo), Category, Tags, Country, Publication_Status, and publication date.
2. WHEN a Reader navigates to `/videos/[slug]`, THE Video_Page SHALL display the video player (native HTML5 for uploaded files, iframe embed for external URLs), title, description, Cover_Image, Category, and Tags.
3. THE Homepage SHALL display a "Videos" section showing up to 4 of the most recently published Video_Posts with their Cover_Image and title.
4. IF a Video_Post uses an external embed URL, THEN THE Video_Page SHALL render the embed in a responsive iframe with a 16:9 aspect ratio.
5. IF a Video_Post uses an uploaded video file, THEN THE Video_Page SHALL render a native HTML5 `<video>` element with controls.

---

### Requirement 10: Infrastructure and Containerization

**User Story:** As a developer, I want the entire application stack to run in Docker Compose containers, so that the environment is reproducible and portable.

#### Acceptance Criteria

1. THE System SHALL define all services in `compose.yml`: Next.js application, PostgreSQL database, and MinIO object storage.
2. THE Next.js service SHALL build using the existing multi-stage Dockerfile with `output: "standalone"`.
3. THE PostgreSQL service SHALL use the official `postgres:16-alpine` image and persist data via a named Docker volume.
4. THE MinIO service SHALL use the official `minio/minio` image, expose the API on port 9000 and the console on port 9001, and persist data via a named Docker volume.
5. THE System SHALL pass all service connection strings (database URL, MinIO endpoint, MinIO credentials) to the Next.js service via environment variables defined in `compose.yml`.
6. THE System SHALL include a database migration step (Drizzle `migrate`) that runs before the Next.js application starts, ensuring the schema is up to date on every container start.
7. THE Next.js service SHALL depend on the PostgreSQL and MinIO services being healthy before starting, using Docker Compose `depends_on` with `condition: service_healthy`.
8. THE PostgreSQL service SHALL expose a health check using `pg_isready`.
9. THE MinIO service SHALL expose a health check using the MinIO `/minio/health/live` endpoint.

---

### Requirement 11: Performance and SEO

**User Story:** As a Reader, I want pages to load quickly and be discoverable by search engines, so that I can find and access content efficiently.

#### Acceptance Criteria

1. THE System SHALL use Next.js Incremental Static Regeneration (ISR) or Server-Side Rendering (SSR) for article and category pages to ensure content freshness within 60 seconds of a publish event.
2. THE Homepage SHALL be server-rendered on each request to always reflect the latest Breaking_News and Featured_Articles.
3. THE System SHALL generate a `sitemap.xml` at `/sitemap.xml` listing all published Article, Category, Tag, and Country URLs.
4. THE System SHALL generate a `robots.txt` at `/robots.txt` allowing all crawlers and referencing the sitemap URL.
5. WHEN an article is published, THE System SHALL include structured data (JSON-LD `NewsArticle` schema) in the article page's `<head>`.
