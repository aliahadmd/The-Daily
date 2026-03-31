// Feature: user-comments, Property 13: Rate limiter rejects submissions beyond 5 per minute

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { checkRateLimit } from "../../rate-limiter";

// **Validates: Requirements 7.7**
describe("Property 13 — Rate limiter rejects submissions beyond 5 per minute", () => {
  it("allows exactly 5 calls and rejects the 6th for any userId", () => {
    // Use a counter to ensure each property iteration gets a unique userId,
    // avoiding state pollution from the in-memory Map across runs.
    let runCounter = 0;

    fc.assert(
      fc.property(
        fc.integer({ min: 1000000, max: 9999999 }),
        (baseUserId) => {
          // Combine base userId with a unique offset per run to guarantee isolation
          const userId = baseUserId * 10000 + (runCounter++ % 10000);

          // First 5 calls must all be allowed
          for (let i = 0; i < 5; i++) {
            expect(checkRateLimit(userId)).toEqual({ allowed: true });
          }

          // 6th call must be rejected
          expect(checkRateLimit(userId)).toEqual({ allowed: false });
        }
      ),
      { numRuns: 100 }
    );
  });
});
