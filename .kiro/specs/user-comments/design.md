# Design Document: User Comments

## Overview

This feature adds a public user identity layer and comment system to The Daily newspaper CMS. It introduces two new database tables (`public_users`, `comments`), a separate iron-session cookie for public users, public-facing auth pages (`/register`, `/login`), a comment section on article pages, and admin moderation pages for comments and users.

The design follows the existing patterns in the codebase: Drizzle ORM for schema and queries, iron-session for cookie-based auth, Next.js App Router server components for data fetching, and client components only where interactivity is required.

---

## Architecture

```mermaid
graph TD
    subgraph Public Site
        A[Visitor / Browser]
        B[NavBar - Server Component]
        C[Article Page - Server Component]
        D[CommentSection - Server Component]
        E[CommentForm - Client Component]
        F[/register page]
        G[/login page]
    end

    subgraph API Routes - Public
        H[POST /api/auth/register]
        I[POST /api/auth/login]
        J[POST /api/auth/logout]
        K[POST /api/comments]
    end

    subgraph API Routes - Admin
        L[GET /api/admin/comments]
        M[PATCH /api/admin/comments/[id]]
        N[DELETE /api/admin/comments/[id]]
        O[GET /api/admin/users]
        P[PATCH /api/admin/users/[id]]
    end

    subgraph Admin CMS
        Q[/admin/comments page]
        R[/admin/users page]
        S[Admin Sidebar]
    end

    subgraph Data Layer
        T[(public_users table)]
        U[(comments table)]
        V[(articles table)]
        W[lib/user-auth.ts]
        X[lib/rate-limiter.ts]
        Y[lib/sanitize.ts]
    end

    A --> B
    A --> C
    C --> D
    D --> E
    E --> K
    A --> F
    A --> G
    F --> H
    G --> I
    H --> T
    I --> T
    K --> U
    K --> X
    K --> Y
    W --> T
    Q --> L
    Q --> M
    Q --> N
    R --> O
    R --> P
    L --> U
    M --> U
    N --> U
    O --> T
    P --> T
    U --> V
```

### Key Architectural Decisions

- **Separate auth module**: `lib/user-auth.ts` mirrors `lib/auth.ts` but uses a different cookie name (`newspaper-user-session`) and secret (`USER_SESSION_SECRET`). This prevents any session collision between admin and public users.
- **Server-first rendering**: `NavBar`, `CommentSection`, and admin pages are server components that read session state and DB directly. Only `CommentForm` is a client component (needs `useState` for optimistic UI and form handling).
- **In-memory rate limiter**: A simple `Map<userId, {count, windowStart}>` in `lib/rate-limiter.ts`. Resets per-user after 60 seconds. Sufficient for v1 (single-process deployment).
- **XSS sanitization**: Strip HTML tags server-side in `lib/sanitize.ts` before persisting comment body. Uses a simple regex `/<[^>]*>/g` — no external dependency needed for this use case.

---

## Components and Interfaces

### New Pages

| Route | Type | Description |
|---|---|---|
| `/register` | Server page + client form | Public user registration |
| `/login` | Server page + client form | Public user login |
| `/admin/comments` | Server page | Admin comment moderation list |
| `/admin/users` | Server page | Admin user management list |

### New Components

| Component | Type | Location |
|---|---|---|
| `CommentSection` | Server Component | `components/public/CommentSection.tsx` |
| `CommentForm` | Client Component | `components/public/CommentForm.tsx` |
| `NavBar` | Updated Server Component | `components/public/NavBar.tsx` |

### Updated Components

- **`NavBar`**: Accepts an optional `user` prop (`{ username: string } | null`). The root layout reads the public user session server-side and passes it down. Shows username + logout button when logged in, or Login/Register links when not.
- **`app/articles/[slug]/page.tsx`**: Adds `<CommentSection articleId={article.id} />` below the article body.
- **`app/admin/layout.tsx`**: Adds "Comments" and "Users" entries to `navLinks`.

### API Route Contracts

#### `POST /api/auth/register`
- Body: `{ username, email, password }` (JSON or FormData)
- Success: Creates user, creates session, redirects to `/`
- Errors: 400 with `{ field, message }` for duplicate username/email or short password

#### `POST /api/auth/login`
- Body: `{ email, password }`
- Success: Creates session, redirects to `/` (or `?redirect` param)
- Errors: 401 for invalid credentials or banned account

#### `POST /api/auth/logout`
- Destroys public user session, redirects to `/`

#### `POST /api/comments`
- Auth: Requires valid public user session
- Body: `{ articleId: number, body: string }`
- Success: 201 `{ id, status: "pending" }`
- Errors: 401 unauthenticated, 403 banned, 422 validation failure, 429 rate limited

#### `GET /api/admin/comments?status=&articleId=&page=`
- Auth: Admin session required
- Returns paginated comment list with username, article title, body (truncated 150 chars), status, createdAt

#### `PATCH /api/admin/comments/[id]`
- Auth: Admin session required
- Body: `{ status: "approved" | "rejected" }`
- Returns updated comment

#### `DELETE /api/admin/comments/[id]`
- Auth: Admin session required
- Returns 204

#### `GET /api/admin/users?search=&page=`
- Auth: Admin session required
- Returns paginated user list with username, email, createdAt, commentCount, status

#### `PATCH /api/admin/users/[id]`
- Auth: Admin session required
- Body: `{ status: "active" | "banned" }`
- Returns updated user

---

## Data Models

### New Drizzle Schema Additions (`lib/db/schema.ts`)

```typescript
export const userStatusEnum = pgEnum("user_status", ["active", "banned"]);

export const commentStatusEnum = pgEnum("comment_status", ["pending", "approved", "rejected"]);

export const publicUsers = pgTable("public_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  status: userStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id")
    .notNull()
    .references(() => articles.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => publicUsers.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  status: commentStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Migration

A new Drizzle migration file will be generated at `lib/db/migrations/` via `pnpm drizzle-kit generate`. It will:
1. Create the `user_status` and `comment_status` enums
2. Create the `public_users` table
3. Create the `comments` table with FK constraints and cascade delete

### New Auth Module (`lib/user-auth.ts`)

```typescript
export interface UserSession {
  userId: number;
  username: string;
}

export const userSessionOptions = {
  cookieName: "newspaper-user-session",
  password: process.env.USER_SESSION_SECRET!,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

// getUserSession(), createUserSession(), destroyUserSession()
// mirrors lib/auth.ts pattern
```

### Rate Limiter (`lib/rate-limiter.ts`)

```typescript
// In-memory store: Map<userId, { count: number; windowStart: number }>
// checkRateLimit(userId: number): { allowed: boolean }
// Allows max 5 submissions per 60-second window per user
```

### Sanitizer (`lib/sanitize.ts`)

```typescript
// stripHtml(input: string): string
// Removes all HTML tags using /<[^>]*>/g
// Also trims whitespace
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Password hashing never stores plaintext

*For any* password string, the result of `hashPassword(password)` should not equal the original password, and should be a valid bcrypt hash with a cost factor of at least 12.

**Validates: Requirements 1.6**

---

### Property 2: Registration round-trip creates account and session

*For any* combination of unique username, unique email, and password of length ≥ 8, calling the register handler should result in a new `public_users` row existing in the database with the given username and email, and a valid user session being established.

**Validates: Requirements 1.2, 1.7**

---

### Property 3: Short password registration is rejected

*For any* password string with length strictly less than 8 characters, the registration handler should return a validation error and no new `public_users` row should be created.

**Validates: Requirements 1.5**

---

### Property 4: Login round-trip produces a session

*For any* registered active user with known credentials, submitting those credentials to the login handler should produce a valid `UserSession` containing the correct `userId` and `username`.

**Validates: Requirements 2.2**

---

### Property 5: Banned users are rejected at login and comment submission

*For any* user whose `status` is `banned`, both the login handler and the comment submission handler should return an error response and should not create a session or persist a comment.

**Validates: Requirements 2.4, 3.6**

---

### Property 6: Ban/unban is a round-trip that restores active status

*For any* active user, setting their status to `banned` and then setting it back to `active` should result in the user having `status = "active"` — identical to their original state.

**Validates: Requirements 5.3, 5.4**

---

### Property 7: Comment body validation enforces 1–2000 character range

*For any* comment body string with length between 1 and 2000 characters (inclusive), the comment should be saved with `status = "pending"`. For any body that is empty or exceeds 2000 characters, the submission should be rejected with a validation error and no comment row should be created.

**Validates: Requirements 3.3, 3.5**

---

### Property 8: Public comment visibility shows only approved comments in ascending order

*For any* article with a set of comments in mixed statuses, the list returned by the public comment query should contain only comments with `status = "approved"`, and they should be ordered by `createdAt` ascending.

**Validates: Requirements 3.7**

---

### Property 9: Moderation state transitions are correct

*For any* comment, approving it (regardless of current status) should result in `status = "approved"`, and rejecting it (regardless of current status) should result in `status = "rejected"`. The transition should be idempotent: approving an already-approved comment leaves it approved.

**Validates: Requirements 4.3, 4.4**

---

### Property 10: Cascade delete removes all comments for a deleted article

*For any* article with any number of associated comments, deleting the article should result in zero comments remaining in the `comments` table with that `articleId`.

**Validates: Requirements 7.2, 7.3**

---

### Property 11: Banning a user does not delete their approved comments

*For any* user with a set of approved comments, setting that user's status to `banned` should leave the count and content of their approved comments unchanged.

**Validates: Requirements 5.6**

---

### Property 12: XSS sanitization strips all HTML tags from comment body

*For any* string containing HTML tags (e.g. `<script>`, `<b>`, `<img src=x onerror=...>`), `stripHtml(input)` should return a string containing no `<` or `>` characters, while preserving the non-tag text content.

**Validates: Requirements 7.5**

---

### Property 13: Rate limiter rejects submissions beyond 5 per minute

*For any* user ID, calling `checkRateLimit(userId)` more than 5 times within a 60-second window should return `{ allowed: false }` on the 6th and subsequent calls. After the window resets, the first call should return `{ allowed: true }` again.

**Validates: Requirements 7.7**

---

### Property 14: Pending comment count matches actual pending comments

*For any* set of comments in the database, the pending count value returned by the admin comments query should equal the exact number of comment rows with `status = "pending"`.

**Validates: Requirements 4.7**

---

### Property 15: User search returns only matching users

*For any* search query string, the admin user search should return only users whose `username` or `email` contains the query string (case-insensitive), and should return no users that do not match.

**Validates: Requirements 5.5**

---

## Error Handling

| Scenario | HTTP Status | Response |
|---|---|---|
| Unauthenticated comment submission | 401 | `{ error: "Login required" }` |
| Banned user action | 403 | `{ error: "Account suspended" }` |
| Comment body empty or > 2000 chars | 422 | `{ error: "...", field: "body" }` |
| Rate limit exceeded | 429 | `{ error: "Too many comments. Try again in a minute." }` |
| Duplicate username on register | 400 | `{ error: "Username already taken", field: "username" }` |
| Duplicate email on register | 400 | `{ error: "Email already registered", field: "email" }` |
| Invalid login credentials | 401 | `{ error: "Invalid email or password" }` |
| Admin route without admin session | 401 | Redirect to `/admin/login` |
| Comment not found (admin PATCH/DELETE) | 404 | `{ error: "Not found" }` |

All API routes validate input before touching the database. Server actions and route handlers catch unexpected DB errors and return 500 with a generic message (no stack traces in production).

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required. They are complementary:
- Unit tests cover specific examples, integration points, and edge cases
- Property tests verify universal correctness across randomized inputs

### Property-Based Testing Library

Use **`fast-check`** (TypeScript-native, works in Node.js without a test runner dependency). Each property test runs a minimum of **100 iterations**.

Each property test must be tagged with a comment in this format:
```
// Feature: user-comments, Property N: <property text>
```

Each correctness property in this document maps to exactly one property-based test.

### Unit Tests (specific examples and integration)

- Registration with duplicate username returns 400 with correct field error
- Registration with duplicate email returns 400 with correct field error
- Login with wrong password returns 401
- Login page renders Login/Register links when no session
- NavBar renders username and logout button when session present
- Admin comment list returns comments sorted by `createdAt` descending
- Admin filter by status returns only comments of that status
- Session cookie options: `httpOnly: true`, `sameSite: "lax"`, cookie name is `"newspaper-user-session"` (not `"newspaper-admin-session"`)
- `stripHtml` preserves text content while removing tags (specific examples: `<b>hello</b>` → `hello`, `<script>alert(1)</script>` → `alert(1)`)

### Property Tests (one per correctness property)

| Test File | Property |
|---|---|
| `lib/__tests__/properties/user-comments-p1.test.ts` | Password hashing never stores plaintext |
| `lib/__tests__/properties/user-comments-p2.test.ts` | Registration round-trip |
| `lib/__tests__/properties/user-comments-p3.test.ts` | Short password rejection |
| `lib/__tests__/properties/user-comments-p4.test.ts` | Login round-trip |
| `lib/__tests__/properties/user-comments-p5.test.ts` | Banned user rejection |
| `lib/__tests__/properties/user-comments-p6.test.ts` | Ban/unban round-trip |
| `lib/__tests__/properties/user-comments-p7.test.ts` | Comment body validation |
| `lib/__tests__/properties/user-comments-p8.test.ts` | Comment visibility ordering |
| `lib/__tests__/properties/user-comments-p9.test.ts` | Moderation state transitions |
| `lib/__tests__/properties/user-comments-p10.test.ts` | Cascade delete |
| `lib/__tests__/properties/user-comments-p11.test.ts` | Ban preserves approved comments |
| `lib/__tests__/properties/user-comments-p12.test.ts` | XSS sanitization |
| `lib/__tests__/properties/user-comments-p13.test.ts` | Rate limiter |
| `lib/__tests__/properties/user-comments-p14.test.ts` | Pending count accuracy |
| `lib/__tests__/properties/user-comments-p15.test.ts` | User search correctness |

Properties P1, P3, P7, P8, P9, P12, P13, P14, P15 can be tested against pure functions (`hashPassword`, `stripHtml`, `checkRateLimit`, query helpers) without a live database. Properties P2, P4, P5, P6, P10, P11 require a test database or an in-memory mock of the Drizzle queries.
