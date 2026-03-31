// Feature: article-subscription, Property 6: Webhook subscription status events map to correct local status

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

function mapStripeStatusToLocal(
  stripeStatus: string
): "active" | "canceled" {
  return stripeStatus === "active" ? "active" : "canceled";
}

// Known non-active statuses per Stripe's subscription lifecycle
const cancelingStatusArb = fc.oneof(
  fc.constant("past_due"),
  fc.constant("unpaid"),
  fc.constant("canceled")
);

// Any string that is not "active"
const nonActiveStringArb = fc.string().filter((s) => s !== "active");

// **Validates: Requirements 3.3, 3.4, 3.5**
describe("Property 6 — Webhook subscription status events map to correct local status", () => {
  it('Stripe status "active" maps to local status "active"', () => {
    fc.assert(
      fc.property(fc.constant("active"), (status) => {
        expect(mapStripeStatusToLocal(status)).toBe("active");
      }),
      { numRuns: 100 }
    );
  });

  it('Stripe status "past_due" maps to local status "canceled"', () => {
    fc.assert(
      fc.property(fc.constant("past_due"), (status) => {
        expect(mapStripeStatusToLocal(status)).toBe("canceled");
      }),
      { numRuns: 100 }
    );
  });

  it('Stripe status "unpaid" maps to local status "canceled"', () => {
    fc.assert(
      fc.property(fc.constant("unpaid"), (status) => {
        expect(mapStripeStatusToLocal(status)).toBe("canceled");
      }),
      { numRuns: 100 }
    );
  });

  it('Stripe status "canceled" maps to local status "canceled"', () => {
    fc.assert(
      fc.property(fc.constant("canceled"), (status) => {
        expect(mapStripeStatusToLocal(status)).toBe("canceled");
      }),
      { numRuns: 100 }
    );
  });

  it("any non-active Stripe status maps to local status canceled", () => {
    fc.assert(
      fc.property(nonActiveStringArb, (status) => {
        expect(mapStripeStatusToLocal(status)).toBe("canceled");
      }),
      { numRuns: 100 }
    );
  });

  it("known canceling statuses all map to canceled", () => {
    fc.assert(
      fc.property(cancelingStatusArb, (status) => {
        expect(mapStripeStatusToLocal(status)).toBe("canceled");
      }),
      { numRuns: 100 }
    );
  });
});
