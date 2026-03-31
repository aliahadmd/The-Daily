# Design Document: Article Subscription

## Overview

This feature adds a monthly subscription paywall to The Daily newspaper CMS. Readers pay $5/month via Stripe to unlock full article content. Non-subscribed users (including unauthenticated visitors) see the article page with scroll blocked and a smooth animated drawer prompting them to subscribe. Subscribed users read freely.

Subscription state is stored in a new `subscriptions` table and checked server-side on every article page render — no Stripe API call at read time. Stripe webhooks keep the local subscription status in sync with billing events.

The design follows existing codebase patterns: Drizzle ORM for schema and queries, iron-session for public user auth, Next.js App Router server components for data fetching, and client components only where interactivity is required.

---

## Architecture

```mermaid
graph TD
    subgraph Public Site
        A[Visitor / Browser]
        B[Article Page - Server Component]
        C[SubscriptionDrawer - Client Component]
    end

    subgraph API Routes
        D[POST /api/stripe/checkout]
        E[POST /api/stripe/webhook]
    end

    subgraph Admin CMS
        F[/admin/users page - Server Component]
    end

    subgraph Data Layer
        G[(public_users table)]
        H[(subscriptions table)]
        I[lib/queries/subscriptions.ts]
        J[lib/queries/users.ts - updated]
        K[lib/db/schema.ts - updated]
    end

    subgraph External
        L[Stripe API]
        M[Stripe Webhooks]
    end

    A --> B
    B --> I
    I --> H
    H --> G
    B --> C
    C --> D
    D --> L
    L --> M
    M --> E
    E --> I
    F --> J
    J --> H
    J --> G
```

### Key Architectural Decisions

- **Server-side paywall check**: Subscription status is resolved in the article page server component by querying the `subscriptions` table directly. No client-side fetch, no Stripe API call at read time. This means the paywall state is baked into the initial HTML.
- **SubscriptionDrawer is a client component**: It needs `useEffect` to trigger the CSS animation on mount and to apply `overflow:hidden` to `document.body`. The server component passes `isSubscriber: boolean` as a prop — the drawer only mounts when `isSubscriber` is false.
- **Upsert pattern for webhook handlers**: All webhook events use an `INSERT ... ON CONFLICT (userId) DO UPDATE` upsert so there is never a separate "create vs update" branch to maintain.
- **Stripe metadata carries `publicUserId`**: The checkout session creation attaches `publicUserId` as a string in Stripe metadata. The webhook handler reads this to find the correct user without needing to look up by email.
- **Environment variable validation at module load**: A `lib/stripe.ts` module initializes the Stripe client and validates all required env vars at import time, throwing a descriptive error if any are missing.

---

## Components and Interfaces

### New Files

| Path | Type | Description |
|---|---|---|
| `components/public/SubscriptionDrawer.tsx` | Client Component | Animated paywall drawer |
| `app/api/stripe/checkout/route.ts` | API Route | Creates Stripe Checkout Session |
| `app/api/stripe/webhook/route.ts` | API Route | Handles Stripe webhook events |
| `lib/queries/subscriptions.ts` | Query module | All subscription DB reads/writes |
| `lib/stripe.ts` | Utility | Stripe client init + env validation |
| `lib/db/migrations/XXXX_add_subscriptions.sql` | Migration | Adds `subscriptions` table |

### Updated Files

| Path | Change |
|---|---|
| `lib/db/schema.ts` | Add `subscriptionStatusEnum` and `subscriptions` table |
| `lib/queries/users.ts` | Update `listUsers` / `searchUsers` to left-join `subscriptions` |
| `app/articles/[slug]/page.tsx` | Query subscription status, pass `isSubscriber` to drawer |
| `app/admin/users/page.tsx` | Add Subscription Status column |

### SubscriptionDrawer Props

```typescript
interface SubscriptionDrawerProps {
  articleSlug: string;
  userId: number | null; // null = unauthenticated
}
```

The drawer is only rendered when the user is not a subscriber. It receives the article slug to construct the Stripe checkout redirect URLs and the login redirect URL.

### API Route Contracts

#### `POST /api/stripe/checkout`
- Auth: Requires valid public user session (iron-session)
- Body: `{ slug: string }` — the article slug to return to after checkout
- Success: `302` redirect to Stripe Checkout URL
- Errors:
  - `401` — no user session (should not happen; client guards this)
  - `500` — Stripe API error

#### `POST /api/stripe/webhook`
- Auth: Stripe signature verification via `STRIPE_WEBHOOK_SECRET`
- Body: Raw Stripe event payload
- Handled events: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`
- Success: `200 { received: true }`
- Errors:
  - `400` — signature verification failed
  - `200` — unknown event type or missing userId (acknowledged, not processed)

---

## Data Models

### Schema Addition (`lib/db/schema.ts`)

```typescript
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "canceled"]);

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => publicUsers.id, { onDelete: "cascade" }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).notNull(),
  status: subscriptionStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

The `unique()` on `userId` enforces the one-subscription-per-user invariant at the database level.

### Query Module (`lib/queries/subscriptions.ts`)

```typescript
// getSubscriptionByUserId(userId: number): Promise<Subscription | null>
// Returns null when no row exists — caller treats null as status "none"

// upsertSubscription(data: {
//   userId: number;
//   stripeCustomerId: string;
//   stripeSubscriptionId: string;
//   status: "active" | "canceled";
// }): Promise<void>
// INSERT ... ON CONFLICT (user_id) DO UPDATE SET status, updatedAt

// getSubscriptionByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null>
// Used by webhook handlers for subscription.updated / subscription.deleted events
```

### Updated `listUsers` / `searchUsers`

Both functions gain a left join to `subscriptions` and expose a `subscriptionStatus: "none" | "active" | "canceled"` field:

```typescript
subscriptionStatus: sql<"none" | "active" | "canceled">`
  coalesce(${subscriptions.status}, 'none')
`,
```

### Migration

A Drizzle migration generated via `pnpm drizzle-kit generate` will:
1. Create the `subscription_status` enum (`active`, `canceled`)
2. Create the `subscriptions` table with the unique constraint on `user_id` and cascade delete FK

### Stripe Client (`lib/stripe.ts`)

```typescript
import Stripe from "stripe";

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

export const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
  apiVersion: "2024-06-20",
});

export const STRIPE_PRICE_ID = requireEnv("STRIPE_PRICE_ID");
export const STRIPE_WEBHOOK_SECRET = requireEnv("STRIPE_WEBHOOK_SECRET");
```

This module is only imported in server-side code. The `requireEnv` calls execute at module load time, so a missing variable surfaces immediately on startup rather than at the first request.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Paywall visibility matches subscription status

*For any* user and their subscription record (or absence thereof), the `shouldShowPaywall` determination should return `true` if and only if the subscription status is `none` or `canceled`, and `false` if and only if the status is `active`.

**Validates: Requirements 1.1, 1.3, 4.3**

---

### Property 2: Checkout session URLs contain the article slug

*For any* article slug, the Stripe Checkout Session parameters constructed by the checkout handler should have a `success_url` and a `cancel_url` that both contain that slug as a substring.

**Validates: Requirements 2.3, 2.4**

---

### Property 3: Unauthenticated subscribe redirects to login with return URL

*For any* article slug, when an unauthenticated visitor triggers the subscribe action, the redirect target should be `/login?redirect=/articles/{slug}`.

**Validates: Requirements 2.5**

---

### Property 4: Invalid webhook signatures are rejected without DB mutation

*For any* webhook payload with an invalid or missing Stripe signature, the handler should return HTTP 400 and the `subscriptions` table should remain unchanged.

**Validates: Requirements 3.1, 3.6**

---

### Property 5: checkout.session.completed upserts active subscription with Stripe IDs

*For any* valid `checkout.session.completed` event containing a `publicUserId` in metadata, a `customerId`, and a `subscriptionId`, the handler should upsert a subscription row with `status = "active"`, the correct `stripeCustomerId`, and the correct `stripeSubscriptionId`.

**Validates: Requirements 3.2**

---

### Property 6: Webhook subscription status events map to correct local status

*For any* `customer.subscription.updated` or `customer.subscription.deleted` event referencing an existing subscription, the resulting `status` in the `subscriptions` table should be `"active"` when the Stripe status is `"active"`, and `"canceled"` when the Stripe status is `"deleted"`, `"past_due"`, or `"unpaid"`.

**Validates: Requirements 3.3, 3.4, 3.5**

---

### Property 7: Each user has at most one subscription row

*For any* sequence of upsert operations on the same `userId`, the `subscriptions` table should contain exactly one row for that `userId` after all operations complete.

**Validates: Requirements 4.2**

---

### Property 8: Subscription upsert always advances updatedAt

*For any* existing subscription row, performing an upsert with new data should result in an `updatedAt` value that is greater than or equal to the previous `updatedAt`.

**Validates: Requirements 4.4**

---

### Property 9: Deleting a user cascade-deletes their subscription

*For any* user who has a subscription row, deleting that user from `public_users` should result in zero rows in `subscriptions` with that `userId`.

**Validates: Requirements 4.5**

---

### Property 10: Admin user list returns correct subscription status for all users

*For any* set of users with varying subscription states (some with active rows, some with canceled rows, some with no row), the admin `listUsers` query should return `"active"`, `"canceled"`, or `"none"` respectively for each user, with no mismatches.

**Validates: Requirements 6.1, 6.2**

---

### Property 11: Missing Stripe env vars throw descriptive errors at startup

*For any* subset of the required Stripe environment variables (`STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`) that is absent, importing `lib/stripe.ts` should throw an error whose message identifies the specific missing variable name.

**Validates: Requirements 8.1, 8.3, 8.4, 8.5**

---

## Error Handling

| Scenario | HTTP Status | Response |
|---|---|---|
| Checkout request with no user session | 401 | `{ error: "Login required" }` |
| Stripe API error during checkout creation | 500 | `{ error: "Failed to create checkout session" }` |
| Webhook signature verification failure | 400 | `{ error: "Invalid signature" }` |
| Webhook event with unknown publicUserId | 200 | `{ received: true }` (logged server-side) |
| Webhook event type not handled | 200 | `{ received: true }` (ignored) |
| Missing Stripe env var at startup | — | Throws `Error: Missing required environment variable: {NAME}` |

The webhook handler must never return a non-2xx status for business logic failures (unknown user, unhandled event type) — Stripe would retry those. Only signature failures warrant a 400.

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
// Feature: article-subscription, Property N: <property text>
```

Each correctness property in this document maps to exactly one property-based test.

### Unit Tests (specific examples and integration)

- Checkout route returns 401 when no session cookie is present
- Webhook route returns 400 for a request with a tampered body
- `getSubscriptionByUserId` returns `null` for a userId with no row
- Admin users page renders a "Subscription" column header
- `SubscriptionDrawer` renders login/register links when `userId` is null
- `SubscriptionDrawer` renders "Subscribe Now" button when `userId` is set

### Property Tests (one per correctness property)

| Test File | Property |
|---|---|
| `lib/__tests__/properties/article-subscription-p1.test.ts` | Paywall visibility matches subscription status |
| `lib/__tests__/properties/article-subscription-p2.test.ts` | Checkout session URLs contain the article slug |
| `lib/__tests__/properties/article-subscription-p3.test.ts` | Unauthenticated subscribe redirects to login with return URL |
| `lib/__tests__/properties/article-subscription-p4.test.ts` | Invalid webhook signatures are rejected without DB mutation |
| `lib/__tests__/properties/article-subscription-p5.test.ts` | checkout.session.completed upserts active subscription |
| `lib/__tests__/properties/article-subscription-p6.test.ts` | Webhook subscription status events map to correct local status |
| `lib/__tests__/properties/article-subscription-p7.test.ts` | Each user has at most one subscription row |
| `lib/__tests__/properties/article-subscription-p8.test.ts` | Subscription upsert always advances updatedAt |
| `lib/__tests__/properties/article-subscription-p9.test.ts` | Deleting a user cascade-deletes their subscription |
| `lib/__tests__/properties/article-subscription-p10.test.ts` | Admin user list returns correct subscription status |
| `lib/__tests__/properties/article-subscription-p11.test.ts` | Missing Stripe env vars throw descriptive errors |

Properties P1, P2, P3, P6, P11 can be tested against pure functions without a live database. Properties P4, P5, P7, P8, P9, P10 require a test database or in-memory mock of the Drizzle queries.
