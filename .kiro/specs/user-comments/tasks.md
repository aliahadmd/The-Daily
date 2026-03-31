# Implementation Plan: User Comments

## Overview

Implement a public user identity layer and comment system. The work proceeds in layers: schema → core utilities → query functions → API routes → UI → admin UI → property tests.

## Tasks

- [x] 1. Database schema and migration
  - [x] 1.1 Add `userStatusEnum`, `commentStatusEnum`, `publicUsers`, and `comments` tables to `lib/db/schema.ts`
    - Add `pgEnum("user_status", ["active", "banned"])` and `pgEnum("comment_status", ["pending", "approved", "rejected"])`
    - Add `publicUsers` table with `id`, `username` (unique, 50), `email` (unique, 255), `passwordHash`, `status`, `createdAt`
    - Add `comments` table with `id`, `articleId` (FK → articles.id, cascade delete), `userId` (FK → publicUsers.id, cascade delete), `body`, `status`, `createdAt`
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 1.2 Generate Drizzle migration and update migrate script
    - Run `pnpm drizzle-kit generate` to produce migration file under `lib/db/migrations/`
    - Verify `scripts/migrate.ts` applies the new migration (no changes needed if it runs all pending migrations automatically)
    - _Requirements: 7.1, 7.2_

- [x] 2. Core library utilities
  - [x] 2.1 Create `lib/user-auth.ts`
    - Export `UserSession` interface `{ userId: number; username: string }`
    - Export `userSessionOptions` with `cookieName: "newspaper-user-session"`, `password: process.env.USER_SESSION_SECRET!`, `httpOnly: true`, `sameSite: "lax"`, `secure` in production
    - Export `getUserSession()`, `createUserSession(data: UserSession)`, `destroyUserSession()` — mirror the pattern in `lib/auth.ts` using `getIronSession`
    - _Requirements: 2.6, 7.6_

  - [x] 2.2 Write unit test for session cookie options
    - Assert `cookieName === "newspaper-user-session"` (not the admin cookie name)
    - Assert `httpOnly: true`, `sameSite: "lax"`
    - _Requirements: 2.6, 7.6_

  - [x] 2.3 Create `lib/sanitize.ts`
    - Export `stripHtml(input: string): string` — strips all HTML tags via `/<[^>]*>/g` and trims whitespace
    - _Requirements: 7.5_

  - [x] 2.4 Write property test for XSS sanitization (P12)
    - **Property 12: XSS sanitization strips all HTML tags from comment body**
    - **Validates: Requirements 7.5**
    - File: `lib/__tests__/properties/user-comments-p12.test.ts`

  - [x] 2.5 Create `lib/rate-limiter.ts`
    - Export `checkRateLimit(userId: number): { allowed: boolean }`
    - In-memory `Map<number, { count: number; windowStart: number }>`, max 5 per 60-second window
    - _Requirements: 7.7_

  - [x] 2.6 Write property test for rate limiter (P13)
    - **Property 13: Rate limiter rejects submissions beyond 5 per minute**
    - **Validates: Requirements 7.7**
    - File: `lib/__tests__/properties/user-comments-p13.test.ts`

- [x] 3. Password hashing property tests
  - [x] 3.1 Write property test for password hashing (P1)
    - **Property 1: Password hashing never stores plaintext**
    - **Validates: Requirements 1.6**
    - File: `lib/__tests__/properties/user-comments-p1.test.ts`
    - Uses `hashPassword` from existing `lib/auth.ts`

  - [x] 3.2 Write property test for short password rejection (P3)
    - **Property 3: Short password registration is rejected**
    - **Validates: Requirements 1.5**
    - File: `lib/__tests__/properties/user-comments-p3.test.ts`
    - Test the validation logic (password.length < 8 → reject) as a pure function

- [x] 4. Database query functions — users
  - [x] 4.1 Create `lib/queries/users.ts`
    - `createUser(data: { username, email, passwordHash })` → inserted row
    - `getUserByEmail(email: string)` → user row or null
    - `getUserById(id: number)` → user row or null
    - `updateUserStatus(id: number, status: "active" | "banned")` → updated row
    - `listUsers(page: number, pageSize: number)` → `{ users, total }` with comment count per user
    - `searchUsers(query: string, page: number, pageSize: number)` → `{ users, total }` filtered by username or email (case-insensitive)
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [x] 4.2 Write property test for user search correctness (P15)
    - **Property 15: User search returns only matching users**
    - **Validates: Requirements 5.5**
    - File: `lib/__tests__/properties/user-comments-p15.test.ts`
    - Mock the query or test the filter predicate as a pure function

- [x] 5. Database query functions — comments
  - [x] 5.1 Create `lib/queries/comments.ts`
    - `createComment(data: { articleId, userId, body })` → inserted row with `status: "pending"`
    - `getApprovedCommentsByArticle(articleId: number)` → comments with `status = "approved"` ordered by `createdAt` ascending, including `username`
    - `listAllComments(opts: { status?, articleId?, page, pageSize })` → `{ comments, total }` with username and article title, ordered by `createdAt` descending
    - `updateCommentStatus(id: number, status: "approved" | "rejected")` → updated row
    - `deleteComment(id: number)` → void
    - `getPendingCommentCount()` → number
    - _Requirements: 3.7, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 5.2 Write property test for comment visibility ordering (P8)
    - **Property 8: Public comment visibility shows only approved comments in ascending order**
    - **Validates: Requirements 3.7**
    - File: `lib/__tests__/properties/user-comments-p8.test.ts`
    - Mock query results and assert filter + sort invariants

  - [x] 5.3 Write property test for comment body validation (P7)
    - **Property 7: Comment body validation enforces 1–2000 character range**
    - **Validates: Requirements 3.3, 3.5**
    - File: `lib/__tests__/properties/user-comments-p7.test.ts`
    - Test the validation predicate as a pure function

  - [x] 5.4 Write property test for moderation state transitions (P9)
    - **Property 9: Moderation state transitions are correct and idempotent**
    - **Validates: Requirements 4.3, 4.4**
    - File: `lib/__tests__/properties/user-comments-p9.test.ts`
    - Mock `updateCommentStatus` and assert approve/reject transitions

  - [x] 5.5 Write property test for pending comment count (P14)
    - **Property 14: Pending comment count matches actual pending comments**
    - **Validates: Requirements 4.7**
    - File: `lib/__tests__/properties/user-comments-p14.test.ts`
    - Mock a list of comments and assert count equals filtered pending rows

- [x] 6. Checkpoint — core layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Public auth API routes
  - [x] 7.1 Create `app/api/auth/register/route.ts`
    - POST: parse `{ username, email, password }` from JSON body
    - Validate: password ≥ 8 chars, unique username, unique email (return 400 with `{ error, field }` on failure)
    - Hash password with `hashPassword` (cost 12), call `createUser`, call `createUserSession`, redirect to `/`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 7.2 Create `app/api/auth/login/route.ts`
    - POST: parse `{ email, password }`, call `getUserByEmail`, verify password with `verifyPassword` (constant-time)
    - If user not found or password wrong → 401 `{ error: "Invalid email or password" }`
    - If user status is `banned` → 401 `{ error: "Account suspended" }`
    - On success: call `createUserSession`, redirect to `?redirect` param or `/`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.4_

  - [x] 7.3 Create `app/api/auth/logout/route.ts`
    - POST: call `destroyUserSession`, redirect to `/`
    - _Requirements: 2.5_

- [x] 8. Comment submission API route
  - [x] 8.1 Create `app/api/comments/route.ts`
    - POST: call `getUserSession` → 401 if no session
    - Fetch user by id, check `status === "banned"` → 403 `{ error: "Account suspended" }`
    - Call `checkRateLimit(userId)` → 429 if not allowed
    - Parse `{ articleId, body }`, validate body length (1–2000) → 422 on failure
    - Call `stripHtml(body)`, call `createComment`, return 201 `{ id, status: "pending" }`
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 7.5, 7.7_

- [x] 9. Admin API routes — comments
  - [x] 9.1 Create `app/api/admin/comments/route.ts`
    - GET: verify admin session (redirect to `/admin/login` if missing)
    - Accept query params `status`, `articleId`, `page` (default 1), `pageSize` (default 20)
    - Call `listAllComments`, return paginated JSON
    - _Requirements: 4.2, 4.6_

  - [x] 9.2 Create `app/api/admin/comments/[id]/route.ts`
    - PATCH: verify admin session, parse `{ status }`, call `updateCommentStatus`, return updated comment or 404
    - DELETE: verify admin session, call `deleteComment`, return 204 or 404
    - _Requirements: 4.3, 4.4, 4.5_

- [x] 10. Admin API routes — users
  - [x] 10.1 Create `app/api/admin/users/route.ts`
    - GET: verify admin session, accept `search` and `page` query params
    - Call `listUsers` or `searchUsers`, return paginated JSON
    - _Requirements: 5.2, 5.5_

  - [x] 10.2 Create `app/api/admin/users/[id]/route.ts`
    - PATCH: verify admin session, parse `{ status: "active" | "banned" }`, call `updateUserStatus`, return updated user or 404
    - _Requirements: 5.3, 5.4_

- [x] 11. Public registration and login pages
  - [x] 11.1 Create `app/register/page.tsx`
    - Client component with a form: username, email, password fields
    - On submit: POST to `/api/auth/register` with JSON body
    - Display field-level errors from response `{ error, field }`
    - On success (redirect response): navigate to `/`
    - _Requirements: 1.1, 1.3, 1.4, 1.5_

  - [x] 11.2 Create `app/login/page.tsx`
    - Client component with a form: email, password fields
    - On submit: POST to `/api/auth/login`
    - Display error message on 401 response
    - On success: navigate to `/`
    - _Requirements: 2.1, 2.3, 2.4_

- [x] 12. Comment UI components
  - [x] 12.1 Create `components/public/CommentForm.tsx`
    - Client component: textarea (max 2000 chars), submit button
    - POST to `/api/comments` with `{ articleId, body }`
    - Optimistic UI: show "Comment submitted for review" on success, clear form
    - Display error messages for 403, 422, 429 responses
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6_

  - [x] 12.2 Create `components/public/CommentSection.tsx`
    - Server component: accepts `articleId: number` and `user: UserSession | null`
    - Fetch approved comments via `getApprovedCommentsByArticle(articleId)`
    - If `user` is set: render `<CommentForm articleId={articleId} />`
    - If no `user`: render login/register prompt with links to `/login` and `/register`
    - Render comment list (username, timestamp, body) or "No comments yet" message
    - _Requirements: 3.1, 3.2, 3.7, 3.8_

- [x] 13. Update NavBar and root layout
  - [x] 13.1 Update `components/public/NavBar.tsx`
    - Add optional `user: { username: string } | null` prop to `NavBarProps`
    - When `user` is set: show username and a logout form (POST to `/api/auth/logout`)
    - When `user` is null: show "Log in" link to `/login` and "Register" link to `/register`
    - _Requirements: 6.1, 6.2_

  - [x] 13.2 Update `app/layout.tsx`
    - Call `getUserSession()` server-side in the root layout
    - Pass `user` prop to `<NavBar>`
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 13.3 Update `app/articles/[slug]/page.tsx`
    - Call `getUserSession()` to get current user
    - Add `<CommentSection articleId={article.id} user={user} />` below the article body
    - _Requirements: 3.1, 3.2_

- [x] 14. Admin UI — comments and users pages
  - [x] 14.1 Create `app/admin/comments/page.tsx`
    - Server component: read `status`, `articleId`, `page` from `searchParams`
    - Fetch via `listAllComments` and `getPendingCommentCount`
    - Render paginated table: username, article title, body (truncated 150 chars), status, timestamp
    - Approve/Reject buttons (POST to `/api/admin/comments/[id]` via form), Delete button
    - Status filter controls (links with `?status=` param)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 14.2 Create `app/admin/users/page.tsx`
    - Server component: read `search` and `page` from `searchParams`
    - Fetch via `listUsers` or `searchUsers`
    - Render paginated table: username, email, registration date, comment count, status
    - Ban/Unban buttons (POST to `/api/admin/users/[id]` via form)
    - Search input (form with `?search=` param)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 14.3 Update `app/admin/layout.tsx`
    - Add `{ href: "/admin/comments", label: "Comments" }` and `{ href: "/admin/users", label: "Users" }` to `navLinks`
    - Fetch `getPendingCommentCount()` and render count as a badge next to the Comments link
    - _Requirements: 4.1, 4.7, 5.1_

- [x] 15. Environment configuration
  - [x] 15.1 Add `USER_SESSION_SECRET` to `.env.local`
    - Append `USER_SESSION_SECRET=<random-secret>` (generate a strong random string, e.g. 32+ chars)
    - _Requirements: 2.6, 7.6_

- [x] 16. Checkpoint — integration complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Property-based tests — logic with mocked DB
  - [x] 17.1 Write property test for banned user rejection (P5)
    - **Property 5: Banned users are rejected at login and comment submission**
    - **Validates: Requirements 2.4, 3.6**
    - File: `lib/__tests__/properties/user-comments-p5.test.ts`
    - Mock `getUserByEmail` / `getUserById` to return a banned user; assert both handlers return error responses

  - [x] 17.2 Write property test for ban/unban round-trip (P6)
    - **Property 6: Ban/unban is a round-trip that restores active status**
    - **Validates: Requirements 5.3, 5.4**
    - File: `lib/__tests__/properties/user-comments-p6.test.ts`
    - Mock `updateUserStatus`; assert active → banned → active yields `status = "active"`

  - [x] 17.3 Write property test for ban preserves comments (P11)
    - **Property 11: Banning a user does not delete their approved comments**
    - **Validates: Requirements 5.6**
    - File: `lib/__tests__/properties/user-comments-p11.test.ts`
    - Mock comment list; assert approved comment count is unchanged after status update

- [x] 18. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests P2, P4, P10 (requiring a live DB) are intentionally omitted from this task list per the user's scope; they can be added later
- The in-memory rate limiter is sufficient for single-process deployment (v1); replace with Redis for multi-instance deployments
- `hashPassword` and `verifyPassword` are reused from `lib/auth.ts` — no duplication needed
