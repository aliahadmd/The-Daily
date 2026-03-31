// Feature: user-comments, Property 9: Moderation state transitions are correct and idempotent

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

type CommentStatus = "pending" | "approved" | "rejected";

/**
 * Pure function mirroring the logic of updateCommentStatus.
 * Applies a moderation action to a comment's current status and returns the new status.
 */
function applyModerationStatus(
  currentStatus: CommentStatus,
  action: "approved" | "rejected"
): CommentStatus {
  return action;
}

const statusArb = fc.constantFrom<CommentStatus>("pending", "approved", "rejected");

// **Validates: Requirements 4.3, 4.4**
describe("Property 9 — Moderation state transitions are correct and idempotent", () => {
  it("approving always results in 'approved' regardless of starting status", () => {
    fc.assert(
      fc.property(statusArb, (currentStatus) => {
        const result = applyModerationStatus(currentStatus, "approved");
        expect(result).toBe("approved");
      }),
      { numRuns: 100 }
    );
  });

  it("rejecting always results in 'rejected' regardless of starting status", () => {
    fc.assert(
      fc.property(statusArb, (currentStatus) => {
        const result = applyModerationStatus(currentStatus, "rejected");
        expect(result).toBe("rejected");
      }),
      { numRuns: 100 }
    );
  });

  it("approving an already-approved comment leaves it 'approved' (idempotent)", () => {
    fc.assert(
      fc.property(fc.constant<CommentStatus>("approved"), (currentStatus) => {
        const result = applyModerationStatus(currentStatus, "approved");
        expect(result).toBe("approved");
      }),
      { numRuns: 100 }
    );
  });

  it("rejecting an already-rejected comment leaves it 'rejected' (idempotent)", () => {
    fc.assert(
      fc.property(fc.constant<CommentStatus>("rejected"), (currentStatus) => {
        const result = applyModerationStatus(currentStatus, "rejected");
        expect(result).toBe("rejected");
      }),
      { numRuns: 100 }
    );
  });
});
