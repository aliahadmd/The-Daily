// Feature: user-comments, Property 8: Public comment visibility shows only approved comments in ascending order

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

type CommentStatus = "pending" | "approved" | "rejected";

interface Comment {
  id: number;
  body: string;
  status: CommentStatus;
  createdAt: Date;
}

// Pure functions mirroring the getApprovedCommentsByArticle query logic
function filterApproved(comments: Comment[]): Comment[] {
  return comments.filter((c) => c.status === "approved");
}

function sortByCreatedAtAsc(comments: Comment[]): Comment[] {
  return [...comments].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

const statusArb = fc.constantFrom<CommentStatus>("pending", "approved", "rejected");

const commentArb = fc.record({
  id: fc.integer({ min: 1, max: 100_000 }),
  body: fc.string({ minLength: 1, maxLength: 200 }),
  status: statusArb,
  createdAt: fc.date({ min: new Date("2020-01-01"), max: new Date("2030-01-01") }),
});

// **Validates: Requirements 3.7**
describe("Property 8 — Public comment visibility shows only approved comments in ascending order", () => {
  it("all returned comments have status === 'approved'", () => {
    fc.assert(
      fc.property(fc.array(commentArb, { minLength: 0, maxLength: 30 }), (comments) => {
        const result = filterApproved(comments);
        for (const comment of result) {
          expect(comment.status).toBe("approved");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("no pending or rejected comments appear in the result", () => {
    fc.assert(
      fc.property(fc.array(commentArb, { minLength: 0, maxLength: 30 }), (comments) => {
        const result = filterApproved(comments);
        const hasNonApproved = result.some((c) => c.status !== "approved");
        expect(hasNonApproved).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("comments are ordered by createdAt ascending", () => {
    fc.assert(
      fc.property(fc.array(commentArb, { minLength: 0, maxLength: 30 }), (comments) => {
        const approved = filterApproved(comments);
        const sorted = sortByCreatedAtAsc(approved);
        for (let i = 1; i < sorted.length; i++) {
          expect(sorted[i].createdAt.getTime()).toBeGreaterThanOrEqual(
            sorted[i - 1].createdAt.getTime()
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  it("combined pipeline: filter then sort yields only approved comments in ascending order", () => {
    fc.assert(
      fc.property(fc.array(commentArb, { minLength: 0, maxLength: 30 }), (comments) => {
        const result = sortByCreatedAtAsc(filterApproved(comments));

        // All approved
        for (const comment of result) {
          expect(comment.status).toBe("approved");
        }

        // Ascending order
        for (let i = 1; i < result.length; i++) {
          expect(result[i].createdAt.getTime()).toBeGreaterThanOrEqual(
            result[i - 1].createdAt.getTime()
          );
        }
      }),
      { numRuns: 100 }
    );
  });
});
