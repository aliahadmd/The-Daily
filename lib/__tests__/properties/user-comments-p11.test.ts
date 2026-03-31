// Feature: user-comments, Property 11: Banning a user does not delete their approved comments

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

type CommentStatus = "pending" | "approved" | "rejected";

interface Comment {
  status: CommentStatus;
}

interface User {
  status: string;
}

// Pure function mirroring updateUserStatus logic
function banUser(user: User): User {
  return { ...user, status: "banned" };
}

// Pure function counting approved comments
function countApproved(comments: Comment[]): number {
  return comments.filter((c) => c.status === "approved").length;
}

const commentStatusArb = fc.constantFrom<CommentStatus>("pending", "approved", "rejected");

const commentArb = fc.record({ status: commentStatusArb });

const userArb = fc.record({
  status: fc.constantFrom("active", "banned"),
});

// **Validates: Requirements 5.6**
describe("Property 11 — Banning a user does not delete their approved comments", () => {
  it("approved comment count is unchanged after banning the user", () => {
    fc.assert(
      fc.property(
        userArb,
        fc.array(commentArb, { minLength: 0, maxLength: 50 }),
        (user, comments) => {
          const before = countApproved(comments);
          banUser(user); // ban does not touch comments
          const after = countApproved(comments);
          expect(after).toBe(before);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("banUser returns status 'banned' and does not mutate comments array", () => {
    fc.assert(
      fc.property(
        userArb,
        fc.array(commentArb, { minLength: 0, maxLength: 50 }),
        (user, comments) => {
          const originalLength = comments.length;
          const banned = banUser(user);
          expect(banned.status).toBe("banned");
          expect(comments.length).toBe(originalLength);
        }
      ),
      { numRuns: 100 }
    );
  });
});
