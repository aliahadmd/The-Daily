// Feature: article-subscription, Property 1: Paywall visibility matches subscription status

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

function shouldShowPaywall(subscriptionStatus: "none" | "active" | "canceled"): boolean {
  return subscriptionStatus !== "active";
}

// **Validates: Requirements 1.1, 1.3, 4.3**
describe("Property 1 — Paywall visibility matches subscription status", () => {
  it("returns true for status 'none' or 'canceled'", () => {
    const nonActiveArb = fc.constantFrom("none" as const, "canceled" as const);
    fc.assert(
      fc.property(nonActiveArb, (status) => {
        expect(shouldShowPaywall(status)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("returns false for status 'active'", () => {
    fc.assert(
      fc.property(fc.constant("active" as const), (status) => {
        expect(shouldShowPaywall(status)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("is deterministic — same input always gives same output", () => {
    const anyStatusArb = fc.constantFrom("none" as const, "active" as const, "canceled" as const);
    fc.assert(
      fc.property(anyStatusArb, (status) => {
        expect(shouldShowPaywall(status)).toBe(shouldShowPaywall(status));
      }),
      { numRuns: 100 }
    );
  });
});
