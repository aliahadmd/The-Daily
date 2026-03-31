# Requirements Document

## Introduction

This feature adds a monthly subscription paywall to the international newspaper CMS. Readers pay $5/month via Stripe to unlock full article content. Non-subscribed users can see the article page but scroll is blocked and a smooth bottom-to-middle animated drawer appears prompting them to subscribe. Subscribed users read freely with no restrictions. Subscription state is tied to the existing `publicUsers` accounts and managed via Stripe webhooks.

## Glossary

- **Public_User**: A registered reader with an account on the public-facing newspaper site (existing `public_users` table)
- **Subscriber**: A Public_User whose Stripe subscription is currently active
- **Subscription**: A recurring monthly Stripe billing agreement at $5/month
- **Paywall**: The UI mechanism that blocks scroll and shows the Subscription_Drawer to non-subscribed users on article detail pages
- **Subscription_Drawer**: The animated bottom-to-middle overlay component that presents subscription options to non-subscribed users
- **Stripe**: The third-party payment processor used for billing and subscription management
- **Stripe_Webhook**: An HTTP callback from Stripe that notifies the system of subscription lifecycle events
- **Checkout_Session**: A Stripe-hosted payment page where a Public_User enters billing details
- **User_Session**: The existing iron-session cookie (`newspaper-user-session`) identifying an authenticated Public_User
- **Subscription_Status**: The current billing state of a Public_User — one of `none`, `active`, or `canceled`
- **Article_Page**: The public-facing article detail page at `/articles/[slug]`

---

## Requirements

### Requirement 1: Subscription Paywall on Article Pages

**User Story:** As a visitor, I want to see a preview of article content and a clear subscription prompt, so that I understand I need to subscribe to read the full article.

#### Acceptance Criteria

1. WHEN a Public_User with `Subscription_Status` of `none` or `canceled` visits an Article_Page, THE Paywall SHALL block the user from scrolling the article body by applying `overflow: hidden` to the document body.
2. WHEN a Public_User with `Subscription_Status` of `none` or `canceled` visits an Article_Page, THE Subscription_Drawer SHALL animate from the bottom of the viewport to the vertical midpoint of the viewport using a smooth CSS transition of at most 500ms.
3. WHEN a Subscriber visits an Article_Page, THE Paywall SHALL NOT block scroll and THE Subscription_Drawer SHALL NOT be displayed.
4. WHEN a visitor who is not logged in visits an Article_Page, THE Paywall SHALL block scroll and THE Subscription_Drawer SHALL display links to `/login` and `/register` in addition to the subscription call-to-action.
5. THE Subscription_Drawer SHALL display the subscription price ($5/month) and a "Subscribe Now" button.
6. THE Subscription_Drawer SHALL remain visible and SHALL NOT be dismissible by the user without completing a subscription or logging in as a Subscriber.

---

### Requirement 2: Subscription Checkout via Stripe

**User Story:** As a logged-in reader, I want to subscribe with my credit card through a secure checkout, so that I can access full article content.

#### Acceptance Criteria

1. WHEN a logged-in non-subscribed Public_User clicks "Subscribe Now" in the Subscription_Drawer, THE System SHALL create a Stripe Checkout_Session for a recurring monthly $5 subscription and redirect the user to the Stripe-hosted checkout page.
2. WHEN a Stripe Checkout_Session is created, THE System SHALL attach the `publicUserId` as metadata on the Checkout_Session so that the Stripe_Webhook can identify the user.
3. WHEN a user completes checkout successfully, Stripe SHALL redirect the user to the Article_Page they were viewing before checkout (via a `success_url` containing the article slug).
4. WHEN a user cancels checkout, Stripe SHALL redirect the user back to the Article_Page they were viewing (via a `cancel_url` containing the article slug).
5. IF a non-logged-in visitor clicks "Subscribe Now", THEN THE System SHALL redirect the user to `/login` with a `?redirect` parameter pointing back to the current Article_Page.
6. THE System SHALL use a Stripe Price ID configured via the `STRIPE_PRICE_ID` environment variable for the $5/month recurring price.

---

### Requirement 3: Subscription Lifecycle via Stripe Webhooks

**User Story:** As a system operator, I want subscription state to stay in sync with Stripe billing events, so that access is granted and revoked accurately.

#### Acceptance Criteria

1. THE System SHALL expose a webhook endpoint at `POST /api/stripe/webhook` that receives and verifies Stripe event payloads using the `STRIPE_WEBHOOK_SECRET` environment variable.
2. WHEN Stripe sends a `checkout.session.completed` event, THE System SHALL set the corresponding Public_User's `Subscription_Status` to `active` and store the Stripe `customerId` and `subscriptionId` on the user record.
3. WHEN Stripe sends a `customer.subscription.deleted` event, THE System SHALL set the corresponding Public_User's `Subscription_Status` to `canceled`.
4. WHEN Stripe sends a `customer.subscription.updated` event with status `active`, THE System SHALL ensure the corresponding Public_User's `Subscription_Status` is `active`.
5. WHEN Stripe sends a `customer.subscription.updated` event with status `past_due` or `unpaid`, THE System SHALL set the corresponding Public_User's `Subscription_Status` to `canceled`.
6. IF a Stripe webhook payload fails signature verification, THEN THE System SHALL return HTTP 400 and SHALL NOT update any user record.
7. IF a Stripe webhook event references a `publicUserId` that does not exist in the database, THEN THE System SHALL return HTTP 200 to acknowledge receipt and SHALL log the discrepancy without throwing an error.

---

### Requirement 4: Subscription Data Storage

**User Story:** As a system operator, I want subscription state stored in the database, so that access checks are fast and do not require a Stripe API call on every page load.

#### Acceptance Criteria

1. THE System SHALL add a `subscriptions` table to the database with columns for `id`, `userId` (FK to `public_users.id`), `stripeCustomerId`, `stripeSubscriptionId`, `status` (one of `active`, `canceled`), `createdAt`, and `updatedAt`.
2. THE System SHALL enforce a unique constraint on `subscriptions.userId` so that each Public_User has at most one subscription record.
3. WHEN a Public_User's subscription record does not exist in the `subscriptions` table, THE System SHALL treat the user's `Subscription_Status` as `none`.
4. WHEN a subscription record is updated via a Stripe_Webhook, THE System SHALL update the `updatedAt` timestamp on the subscription record.
5. WHEN a Public_User account is deleted, THE System SHALL cascade-delete the associated subscription record.

---

### Requirement 5: Subscription Status Check

**User Story:** As a reader, I want the article page to instantly reflect my subscription status, so that I am not shown the paywall after subscribing.

#### Acceptance Criteria

1. WHEN an Article_Page is rendered, THE System SHALL query the `subscriptions` table using the current Public_User's `userId` to determine `Subscription_Status` without calling the Stripe API.
2. WHEN a Subscriber returns to an Article_Page after completing checkout, THE Article_Page SHALL render without the Paywall or Subscription_Drawer.
3. THE System SHALL check subscription status server-side during page rendering so that the paywall state is determined before the page is sent to the browser.

---

### Requirement 6: Subscription Management for Admins

**User Story:** As an Admin, I want to view subscription status for public users, so that I can monitor subscription activity.

#### Acceptance Criteria

1. THE Admin_Users_Page SHALL display a `Subscription_Status` column showing `none`, `active`, or `canceled` for each Public_User.
2. WHEN an Admin views the Admin_Users_Page, THE System SHALL join the `subscriptions` table to display each user's current `Subscription_Status` without calling the Stripe API.

---

### Requirement 7: Subscription Drawer Animation and UX

**User Story:** As a reader, I want the subscription prompt to appear smoothly and feel polished, so that the experience feels professional rather than jarring.

#### Acceptance Criteria

1. THE Subscription_Drawer SHALL use a CSS `transform: translateY` transition to animate from fully below the viewport to its resting position at the vertical midpoint of the viewport.
2. THE Subscription_Drawer SHALL have a transition duration of 400ms and use an `ease-out` easing function.
3. THE Subscription_Drawer SHALL display a semi-transparent backdrop overlay above the article content below the drawer's resting position.
4. WHEN the Subscription_Drawer is visible, THE System SHALL apply a gradient fade effect to the visible article text above the drawer to indicate content continues below.
5. THE Subscription_Drawer SHALL be fully responsive and SHALL display correctly on viewport widths from 320px to 1920px.

---

### Requirement 8: Environment Configuration

**User Story:** As a developer, I want all Stripe credentials managed via environment variables, so that secrets are never committed to source control.

#### Acceptance Criteria

1. THE System SHALL read the Stripe secret key from the `STRIPE_SECRET_KEY` environment variable for all server-side Stripe API calls.
2. THE System SHALL read the Stripe publishable key from the `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` environment variable for any client-side Stripe usage.
3. THE System SHALL read the webhook signing secret from the `STRIPE_WEBHOOK_SECRET` environment variable for webhook signature verification.
4. THE System SHALL read the recurring price ID from the `STRIPE_PRICE_ID` environment variable when creating Checkout_Sessions.
5. IF any required Stripe environment variable is absent at runtime, THEN THE System SHALL throw a descriptive startup error identifying the missing variable rather than failing silently.
