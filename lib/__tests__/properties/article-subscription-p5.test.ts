// Feature: article-subscription, Property 5: checkout.session.completed upserts active subscription with Stripe IDs

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

interface CheckoutSessionEvent {
  metadata: { publicUserId: string };
  customer: string;
  subscription: string;
}

interface UpsertCall {
  userId: number;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: "active" | "canceled";
}

function handleCheckoutSessionCompleted(
  session: CheckoutSessionEvent,
  upsertCalls: UpsertCall[]
): { processed: boolean } {
  const publicUserId = session.metadata?.publicUserId;
  if (!publicUserId) return { processed: false };

  const userId = parseInt(publicUserId, 10);
  if (isNaN(userId)) return { processed: false };

  upsertCalls.push({
    userId,
    stripeCustomerId: session.customer,
    stripeSubscriptionId: session.subscription,
    status: "active",
  });
  return { processed: true };
}

// Generates positive integer user IDs as strings
const publicUserIdArb = fc.integer({ min: 1, max: 1_000_000 }).map(String);

// Generates Stripe-like IDs (e.g. "cus_abc123", "sub_xyz789")
const stripeIdArb = fc.stringMatching(/^[a-zA-Z0-9_]{8,40}$/);

const validSessionArb = fc.record({
  metadata: fc.record({ publicUserId: publicUserIdArb }),
  customer: stripeIdArb,
  subscription: stripeIdArb,
});

// **Validates: Requirements 3.2**
describe("Property 5 — checkout.session.completed upserts active subscription with Stripe IDs", () => {
  it("valid event triggers upsert with status 'active'", () => {
    fc.assert(
      fc.property(validSessionArb, (session) => {
        const upsertCalls: UpsertCall[] = [];
        handleCheckoutSessionCompleted(session, upsertCalls);
        expect(upsertCalls).toHaveLength(1);
        expect(upsertCalls[0].status).toBe("active");
      }),
      { numRuns: 100 }
    );
  });

  it("valid event upserts with the correct stripeCustomerId", () => {
    fc.assert(
      fc.property(validSessionArb, (session) => {
        const upsertCalls: UpsertCall[] = [];
        handleCheckoutSessionCompleted(session, upsertCalls);
        expect(upsertCalls[0].stripeCustomerId).toBe(session.customer);
      }),
      { numRuns: 100 }
    );
  });

  it("valid event upserts with the correct stripeSubscriptionId", () => {
    fc.assert(
      fc.property(validSessionArb, (session) => {
        const upsertCalls: UpsertCall[] = [];
        handleCheckoutSessionCompleted(session, upsertCalls);
        expect(upsertCalls[0].stripeSubscriptionId).toBe(session.subscription);
      }),
      { numRuns: 100 }
    );
  });

  it("valid event upserts with userId parsed from metadata.publicUserId", () => {
    fc.assert(
      fc.property(validSessionArb, (session) => {
        const upsertCalls: UpsertCall[] = [];
        handleCheckoutSessionCompleted(session, upsertCalls);
        expect(upsertCalls[0].userId).toBe(parseInt(session.metadata.publicUserId, 10));
      }),
      { numRuns: 100 }
    );
  });
});
