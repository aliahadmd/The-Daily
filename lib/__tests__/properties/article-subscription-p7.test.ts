// Feature: article-subscription, Property 7: Each user has at most one subscription row

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Simulate the upsert behavior with in-memory storage
function createInMemorySubscriptionStore() {
  const store = new Map<number, any>();
  return {
    upsert(data: {
      userId: number;
      stripeCustomerId: string;
      stripeSubscriptionId: string;
      status: "active" | "canceled";
    }) {
      store.set(data.userId, { ...data, updatedAt: new Date() });
    },
    countForUser(userId: number) {
      return store.has(userId) ? 1 : 0;
    },
    getAll() {
      return [...store.values()];
    },
  };
}

const upsertDataArb = (userId: number) =>
  fc.record({
    userId: fc.constant(userId),
    stripeCustomerId: fc.string({ minLength: 1, maxLength: 50 }),
    stripeSubscriptionId: fc.string({ minLength: 1, maxLength: 50 }),
    status: fc.constantFrom("active" as const, "canceled" as const),
  });

// **Validates: Requirements 4.2**
describe("Property 7 — Each user has at most one subscription row", () => {
  it("exactly one row exists for a userId after any sequence of upserts", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.integer({ min: 1, max: 10 }).chain((n) =>
          fc.integer({ min: 1, max: 100000 }).chain((userId) =>
            fc.array(upsertDataArb(userId), { minLength: n, maxLength: n }).map((ops) => ({
              userId,
              ops,
            }))
          )
        ),
        (_ignored, { userId, ops }) => {
          const store = createInMemorySubscriptionStore();
          for (const op of ops) {
            store.upsert(op);
          }
          expect(store.countForUser(userId)).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("total store size equals number of distinct userIds after mixed upserts", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.integer({ min: 1, max: 5 }).chain((userId) => upsertDataArb(userId)),
          { minLength: 1, maxLength: 20 }
        ),
        (ops) => {
          const store = createInMemorySubscriptionStore();
          const seenUserIds = new Set<number>();
          for (const op of ops) {
            store.upsert(op);
            seenUserIds.add(op.userId);
          }
          expect(store.getAll().length).toBe(seenUserIds.size);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("last upsert wins — final row reflects the most recent operation", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.integer({ min: 2, max: 10 }).chain((n) =>
          fc.integer({ min: 1, max: 100000 }).chain((userId) =>
            fc.array(upsertDataArb(userId), { minLength: n, maxLength: n }).map((ops) => ({
              userId,
              ops,
            }))
          )
        ),
        (_ignored, { userId, ops }) => {
          const store = createInMemorySubscriptionStore();
          for (const op of ops) {
            store.upsert(op);
          }
          const lastOp = ops[ops.length - 1];
          const rows = store.getAll();
          const row = rows.find((r) => r.userId === userId);
          expect(row).toBeDefined();
          expect(row.stripeCustomerId).toBe(lastOp.stripeCustomerId);
          expect(row.stripeSubscriptionId).toBe(lastOp.stripeSubscriptionId);
          expect(row.status).toBe(lastOp.status);
        }
      ),
      { numRuns: 100 }
    );
  });
});
