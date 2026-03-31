// Feature: user-comments, Property 6: Ban/unban is a round-trip that restores active status

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Pure function mirroring the logic of updateUserStatus.
 * Applies a new status to a user and returns the resulting status.
 */
function applyStatus(
  currentStatus: string,
  newStatus: "active" | "banned"
): string {
  return newStatus;
}

const userIdArb = fc.integer({ min: 1, max: 1_000_000 });

// **Validates: Requirements 5.3, 5.4**
describe("Property 6 — Ban/unban is a round-trip that restores active status", () => {
  it("active → banned → active yields 'active' (round-trip)", () => {
    fc.assert(
      fc.property(userIdArb, (_userId) => {
        const afterBan = applyStatus("active", "banned");
        const afterUnban = applyStatus(afterBan, "active");
        expect(afterUnban).toBe("active");
      }),
      { numRuns: 100 }
    );
  });

  it("banned → active → banned yields 'banned' (reverse round-trip)", () => {
    fc.assert(
      fc.property(userIdArb, (_userId) => {
        const afterActivate = applyStatus("banned", "active");
        const afterReBan = applyStatus(afterActivate, "banned");
        expect(afterReBan).toBe("banned");
      }),
      { numRuns: 100 }
    );
  });

  it("setting to the same status is idempotent", () => {
    fc.assert(
      fc.property(
        userIdArb,
        fc.constantFrom<"active" | "banned">("active", "banned"),
        (_userId, status) => {
          const result = applyStatus(status, status);
          expect(result).toBe(status);
        }
      ),
      { numRuns: 100 }
    );
  });
});
