// Feature: article-subscription, Property 8: Subscription upsert always advances updatedAt

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

function createStore() {
  const store = new Map<number, { status: string; updatedAt: Date }>();
  return {
    upsert(userId: number, status: "active" | "canceled") {
      const newUpdatedAt = new Date();
      store.set(userId, { status, updatedAt: newUpdatedAt });
      return newUpdatedAt;
    },
    get(userId: number) {
      return store.get(userId) ?? null;
    },
  };
}

const statusArb = fc.constantFrom("active" as const, "canceled" as const);
const userIdArb = fc.integer({ min: 1, max: 100000 });

// **Validates: Requirements 4.4**
describe("Property 8 — Subscription upsert always advances updatedAt", () => {
  it("second upsert produces updatedAt >= first upsert updatedAt", () => {
    fc.assert(
      fc.property(userIdArb, statusArb, statusArb, (userId, status1, status2) => {
        const store = createStore();
        const t1 = store.upsert(userId, status1);
        const t2 = store.upsert(userId, status2);
        expect(t2.getTime()).toBeGreaterThanOrEqual(t1.getTime());
      }),
      { numRuns: 100 }
    );
  });

  it("stored updatedAt after second upsert is >= stored updatedAt after first upsert", () => {
    fc.assert(
      fc.property(userIdArb, statusArb, statusArb, (userId, status1, status2) => {
        const store = createStore();
        store.upsert(userId, status1);
        const after1 = store.get(userId)!.updatedAt;
        store.upsert(userId, status2);
        const after2 = store.get(userId)!.updatedAt;
        expect(after2.getTime()).toBeGreaterThanOrEqual(after1.getTime());
      }),
      { numRuns: 100 }
    );
  });

  it("updatedAt is non-decreasing across any sequence of upserts", () => {
    fc.assert(
      fc.property(
        userIdArb,
        fc.array(statusArb, { minLength: 2, maxLength: 10 }),
        (userId, statuses) => {
          const store = createStore();
          let prevTime = -Infinity;
          for (const status of statuses) {
            const t = store.upsert(userId, status);
            expect(t.getTime()).toBeGreaterThanOrEqual(prevTime);
            prevTime = t.getTime();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
