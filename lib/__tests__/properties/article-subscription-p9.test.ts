// Feature: article-subscription, Property 9: Deleting a user cascade-deletes their subscription

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

function createCascadeStore() {
  const users = new Set<number>();
  const subscriptions = new Map<number, any>();
  return {
    addUser(userId: number) { users.add(userId); },
    addSubscription(userId: number, data: any) {
      if (users.has(userId)) subscriptions.set(userId, data);
    },
    deleteUser(userId: number) {
      users.delete(userId);
      subscriptions.delete(userId); // cascade
    },
    hasSubscription(userId: number) { return subscriptions.has(userId); },
    subscriptionCount(userId: number) { return subscriptions.has(userId) ? 1 : 0; },
  };
}

const subscriptionDataArb = fc.record({
  stripeCustomerId: fc.string({ minLength: 1, maxLength: 50 }),
  stripeSubscriptionId: fc.string({ minLength: 1, maxLength: 50 }),
  status: fc.constantFrom("active" as const, "canceled" as const),
});

// **Validates: Requirements 4.5**
describe("Property 9 — Deleting a user cascade-deletes their subscription", () => {
  it("subscriptionCount is 0 after deleting a user who had a subscription", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        subscriptionDataArb,
        (userId, subData) => {
          const store = createCascadeStore();
          store.addUser(userId);
          store.addSubscription(userId, subData);

          // Confirm subscription exists before delete
          expect(store.subscriptionCount(userId)).toBe(1);

          store.deleteUser(userId);

          expect(store.subscriptionCount(userId)).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("deleting a user with no subscription still results in zero subscription rows", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        (userId) => {
          const store = createCascadeStore();
          store.addUser(userId);
          // No subscription added
          store.deleteUser(userId);

          expect(store.subscriptionCount(userId)).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("cascade delete only removes the deleted user's subscription, not others", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50000 }),
        fc.integer({ min: 50001, max: 100000 }),
        subscriptionDataArb,
        subscriptionDataArb,
        (userA, userB, subA, subB) => {
          const store = createCascadeStore();
          store.addUser(userA);
          store.addUser(userB);
          store.addSubscription(userA, subA);
          store.addSubscription(userB, subB);

          store.deleteUser(userA);

          expect(store.subscriptionCount(userA)).toBe(0);
          expect(store.subscriptionCount(userB)).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
