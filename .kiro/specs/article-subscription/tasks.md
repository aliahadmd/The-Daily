# Implementation Plan: Article Subscription

## Overview

Implement a Stripe-powered monthly subscription paywall. The work proceeds in layers: schema → Stripe client → query functions → API routes → UI components → admin UI → property tests.

## Tasks

- [x] 1. Database schema and migration
  - [x] 1.1 Add `subscriptionStatusEnum` and `subscriptions` table to `lib/db/schema.ts`
    - Add `pgEnum("subscription_status", ["active", "canceled"])`
    - Add `subscriptions` table with `id`, `userId` (unique FK → publicUsers.id, cascade delete), `stripeCustomerId`, `stripeSubscriptionId`, `status`, `createdAt`, `updatedAt`
    - _Requirements: 4.1, 4.2, 4.5_

  - [x] 1.2 Generate Drizzle migration
    - Run `pnpm drizzle-kit generate` to produce migration file under `lib/db/migrations/`
    - Verify `scripts/migrate.ts` applies the new migration automatically
    - _Requirements: 4.1_

- [x] 2. Stripe client module
  - [x] 2.1 Create `lib/stripe.ts`
    - Implement `requireEnv(name: string): string` — throws `Error: Missing required environment variable: {name}` if absent
    - Export `stripe` (new Stripe instance with `apiVersion: "2024-06-20"`), `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
    - _Requirements: 8.1, 8.3, 8.4, 8.5_

  - [x] 2.2 Write property test for missing env var errors (P11)
    - **Property 11: Missing Stripe env vars throw descriptive errors at startup**
    - **Validates: Requirements 8.1, 8.3, 8.4, 8.5**
    - File: `lib/__tests__/properties/article-subscription-p11.test.ts`

- [x] 3. Subscription query functions
  - [x] 3.1 Create `lib/queries/subscriptions.ts`
    - `getSubscriptionByUserId(userId: number)` → subscription row or null
    - `upsertSubscription(data: { userId, stripeCustomerId, stripeSubscriptionId, status })` → void using `INSERT ... ON CONFLICT (user_id) DO UPDATE SET status, updatedAt`
    - `getSubscriptionByStripeSubscriptionId(stripeSubscriptionId: string)` → subscription row or null
    - _Requirements: 4.1, 4.3, 4.4, 5.1_

  - [x] 3.2 Write property test for paywall visibility logic (P1)
    - **Property 1: Paywall visibility matches subscription status**
    - **Validates: Requirements 1.1, 1.3, 4.3**
    - File: `lib/__tests__/properties/article-subscription-p1.test.ts`

  - [x] 3.3 Write property test for upsert one-row invariant (P7)
    - **Property 7: Each user has at most one subscription row**
    - **Validates: Requirements 4.2**
    - File: `lib/__tests__/properties/article-subscription-p7.test.ts`

  - [x] 3.4 Write property test for upsert advances updatedAt (P8)
    - **Property 8: Subscription upsert always advances updatedAt**
    - **Validates: Requirements 4.4**
    - File: `lib/__tests__/properties/article-subscription-p8.test.ts`

  - [x] 3.5 Write property test for cascade delete (P9)
    - **Property 9: Deleting a user cascade-deletes their subscription**
    - **Validates: Requirements 4.5**
    - File: `lib/__tests__/properties/article-subscription-p9.test.ts`

- [x] 4. Update `lib/queries/users.ts` — join subscription status
  - [x] 4.1 Update `listUsers` and `searchUsers` to left-join `subscriptions`
    - Add `subscriptionStatus: sql<"none" | "active" | "canceled">\`coalesce(${subscriptions.status}, 'none')\`` to the select
    - Import `subscriptions` from schema; add `.leftJoin(subscriptions, eq(subscriptions.userId, publicUsers.id))` to both queries
    - _Requirements: 6.1, 6.2_

  - [x] 4.2 Write property test for admin user list subscription status (P10)
    - **Property 10: Admin user list returns correct subscription status for all users**
    - **Validates: Requirements 6.1, 6.2**
    - File: `lib/__tests__/properties/article-subscription-p10.test.ts`

- [x] 5. Checkpoint — data layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. API route: POST /api/stripe/checkout
  - [x] 6.1 Create `app/api/stripe/checkout/route.ts`
    - Call `getUserSession()` → return 401 `{ error: "Login required" }` if no session
    - Parse `{ slug: string }` from JSON body
    - Call `stripe.checkout.sessions.create` with `STRIPE_PRICE_ID`, `mode: "subscription"`, `success_url` and `cancel_url` containing the article slug, and `metadata: { publicUserId: String(userId) }`
    - On Stripe error → return 500 `{ error: "Failed to create checkout session" }`
    - On success → redirect (302) to Stripe checkout URL
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [x] 6.2 Write property test for checkout session URLs (P2)
    - **Property 2: Checkout session URLs contain the article slug**
    - **Validates: Requirements 2.3, 2.4**
    - File: `lib/__tests__/properties/article-subscription-p2.test.ts`

  - [x] 6.3 Write property test for unauthenticated subscribe redirect (P3)
    - **Property 3: Unauthenticated subscribe redirects to login with return URL**
    - **Validates: Requirements 2.5**
    - File: `lib/__tests__/properties/article-subscription-p3.test.ts`

- [x] 7. API route: POST /api/stripe/webhook
  - [x] 7.1 Create `app/api/stripe/webhook/route.ts`
    - Read raw body via `req.text()` and `stripe-signature` header
    - Verify with `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)` → return 400 `{ error: "Invalid signature" }` on failure
    - Handle `checkout.session.completed`: extract `metadata.publicUserId`, `customer`, `subscription`; call `upsertSubscription` with `status: "active"`
    - Handle `customer.subscription.deleted`: call `getSubscriptionByStripeSubscriptionId`, call `upsertSubscription` with `status: "canceled"`
    - Handle `customer.subscription.updated`: map Stripe status `"active"` → `"active"`, `"past_due"` / `"unpaid"` / `"canceled"` → `"canceled"`; call `upsertSubscription`
    - Unknown `publicUserId` or unhandled event type → return 200 `{ received: true }` (log server-side)
    - Export `const config = { api: { bodyParser: false } }` (or use Next.js route segment config to disable body parsing)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 7.2 Write property test for invalid webhook signature rejection (P4)
    - **Property 4: Invalid webhook signatures are rejected without DB mutation**
    - **Validates: Requirements 3.1, 3.6**
    - File: `lib/__tests__/properties/article-subscription-p4.test.ts`

  - [x] 7.3 Write property test for checkout.session.completed upsert (P5)
    - **Property 5: checkout.session.completed upserts active subscription with Stripe IDs**
    - **Validates: Requirements 3.2**
    - File: `lib/__tests__/properties/article-subscription-p5.test.ts`

  - [x] 7.4 Write property test for webhook status mapping (P6)
    - **Property 6: Webhook subscription status events map to correct local status**
    - **Validates: Requirements 3.3, 3.4, 3.5**
    - File: `lib/__tests__/properties/article-subscription-p6.test.ts`

- [x] 8. Checkpoint — API routes complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. SubscriptionDrawer client component
  - [x] 9.1 Create `components/public/SubscriptionDrawer.tsx`
    - `"use client"` component accepting `{ articleSlug: string; userId: number | null }`
    - On mount (`useEffect`): set `document.body.style.overflow = "hidden"` and trigger CSS animation via state flag
    - Drawer animates from `translateY(100%)` to `translateY(0)` with `transition: transform 400ms ease-out`
    - Resting position at vertical midpoint of viewport (`top: 50vh`)
    - Semi-transparent backdrop overlay below the drawer's resting position
    - Gradient fade on visible article text above the drawer
    - Display subscription price ($5/month) and "Subscribe Now" button
    - When `userId` is null: render links to `/login?redirect=/articles/{articleSlug}` and `/register`
    - When `userId` is set: "Subscribe Now" button POSTs to `/api/stripe/checkout` with `{ slug: articleSlug }`
    - Fully responsive from 320px to 1920px
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 2.1, 2.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 10. Update `app/articles/[slug]/page.tsx`
  - [x] 10.1 Query subscription status and conditionally render `SubscriptionDrawer`
    - Import `getSubscriptionByUserId` from `lib/queries/subscriptions`
    - In the `Promise.all`, add a subscription query: if `user` exists call `getSubscriptionByUserId(user.userId)`, else resolve null
    - Derive `isSubscriber = subscription?.status === "active"`
    - Render `<SubscriptionDrawer articleSlug={slug} userId={user?.userId ?? null} />` below the article body when `!isSubscriber`
    - _Requirements: 1.1, 1.3, 5.1, 5.2, 5.3_

- [x] 11. Update `app/admin/users/page.tsx`
  - [x] 11.1 Add Subscription Status column to the admin users table
    - Add `<th>` header cell "Subscription" to the table header row
    - Add `<td>` cell rendering `user.subscriptionStatus` as a styled badge (same border/color pattern as the existing status badge) for each user row
    - Update the empty-state `colSpan` from 6 to 7
    - _Requirements: 6.1, 6.2_

- [x] 12. Environment variables
  - [x] 12.1 Add Stripe environment variables to `.env.local`
    - Append `STRIPE_SECRET_KEY=`, `STRIPE_PRICE_ID=`, `STRIPE_WEBHOOK_SECRET=`, and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=` with placeholder values
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 13. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests P1, P2, P3, P6, P11 target pure functions and require no live DB
- Property tests P4, P5, P7, P8, P9, P10 mock Drizzle queries or use a test DB
- Each property test file must include the comment `// Feature: article-subscription, Property N: <property text>`
- The webhook route must disable Next.js body parsing to receive the raw payload for Stripe signature verification
- `lib/stripe.ts` is server-only — never import it from client components
