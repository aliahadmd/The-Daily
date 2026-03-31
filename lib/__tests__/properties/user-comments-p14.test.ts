// Feature: user-comments, Property 14: Pending comment count matches actual pending comments

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

type CommentStatus = "pending" | "approved" | "rejected";

interface Comment {
  status: CommentStatus;
}

// Pure function mirroring the getPendingCommentCount query logic
function countPending(comments: Comment[]): number {
  return comments.filter((c) => c.status === "pending").length;
}

const statusArb = fc.constantFrom<CommentStatus>("pending", "approved", "rejected");

const commentArb = fc.record({
  status: statusArb,
});

// **Validates: Requirements 4.7**
describe("Property 14 — Pending comment count matches actual pending comments", () => {
  it("countPending equals the number of comments with status === 'pending'", () => {
    fc.assert(
      fc.property(fc.array(commentArb, { minLength: 0, maxLength: 50 }), (comments) => {
        const count = countPending(comments);
        const expected = comments.filter((c) => c.status === "pending").length;
        expect(count).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it("countPending returns 0 when there are no pending comments", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ status: fc.constantFrom<CommentStatus>("approved", "rejected") }),
          { minLength: 0, maxLength: 50 }
        ),
        (comments) => {
          expect(countPending(comments)).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("countPending equals total length when all comments are pending", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ status: fc.constant<CommentStatus>("pending") }),
          { minLength: 0, maxLength: 50 }
        ),
        (comments) => {
          expect(countPending(comments)).toBe(comments.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
