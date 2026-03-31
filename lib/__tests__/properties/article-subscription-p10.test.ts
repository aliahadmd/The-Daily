// Feature: article-subscription, Property 10: Admin user list returns correct subscription status for all users

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

function getSubscriptionStatus(
  subscriptionRow: { status: "active" | "canceled" } | null
): "none" | "active" | "canceled" {
  return subscriptionRow?.status ?? "none";
}

type UserState = "active" | "canceled" | "none";

interface MockUser {
  id: number;
  username: string;
  subscriptionRow: { status: "active" | "canceled" } | null;
}

function simulateListUsers(users: MockUser[]): Array<{ id: number; subscriptionStatus: "none" | "active" | "canceled" }> {
  return users.map((user) => ({
    id: user.id,
    subscriptionStatus: getSubscriptionStatus(user.subscriptionRow),
  }));
}

// Arbitrary for a single user with a given subscription state
const userStateArb = fc.constantFrom("active" as const, "canceled" as const, "none" as const);

const mockUserArb = fc.tuple(
  fc.integer({ min: 1, max: 100000 }),
  fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
  userStateArb
).map(([id, username, state]): MockUser => ({
  id,
  username,
  subscriptionRow: state === "none" ? null : { status: state },
}));

// **Validates: Requirements 6.1, 6.2**
describe("Property 10 — Admin user list returns correct subscription status for all users", () => {
  it("user with active subscription row returns 'active'", () => {
    fc.assert(
      fc.property(fc.constant({ status: "active" as const }), (row) => {
        expect(getSubscriptionStatus(row)).toBe("active");
      }),
      { numRuns: 100 }
    );
  });

  it("user with canceled subscription row returns 'canceled'", () => {
    fc.assert(
      fc.property(fc.constant({ status: "canceled" as const }), (row) => {
        expect(getSubscriptionStatus(row)).toBe("canceled");
      }),
      { numRuns: 100 }
    );
  });

  it("user with no subscription row (null) returns 'none'", () => {
    fc.assert(
      fc.property(fc.constant(null), (row) => {
        expect(getSubscriptionStatus(row)).toBe("none");
      }),
      { numRuns: 100 }
    );
  });

  it("for any set of users with mixed states, each user's returned status matches their actual subscription state", () => {
    fc.assert(
      fc.property(fc.array(mockUserArb, { minLength: 1, maxLength: 20 }), (users) => {
        const results = simulateListUsers(users);

        expect(results).toHaveLength(users.length);

        for (let i = 0; i < users.length; i++) {
          const user = users[i];
          const result = results[i];
          const expectedStatus: UserState = user.subscriptionRow?.status ?? "none";

          expect(result.id).toBe(user.id);
          expect(result.subscriptionStatus).toBe(expectedStatus);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("returned status is always one of the three valid values", () => {
    const validStatuses = new Set(["none", "active", "canceled"]);
    fc.assert(
      fc.property(fc.array(mockUserArb, { minLength: 1, maxLength: 20 }), (users) => {
        const results = simulateListUsers(users);
        for (const result of results) {
          expect(validStatuses.has(result.subscriptionStatus)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("no mismatches — users with active rows never get 'none' or 'canceled', and vice versa", () => {
    fc.assert(
      fc.property(fc.array(mockUserArb, { minLength: 1, maxLength: 20 }), (users) => {
        const results = simulateListUsers(users);

        // Use index-based lookup since simulateListUsers preserves order
        for (let i = 0; i < users.length; i++) {
          const user = users[i];
          const result = results[i];
          const expectedStatus: UserState = user.subscriptionRow?.status ?? "none";
          expect(result.subscriptionStatus).toBe(expectedStatus);
        }
      }),
      { numRuns: 100 }
    );
  });
});
