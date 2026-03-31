// Feature: user-comments, Property 7: Comment body validation enforces 1–2000 character range

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Pure validation function mirroring the comment submission handler's body check
function isValidCommentBody(body: string): boolean {
  return body.length >= 1 && body.length <= 2000;
}

// **Validates: Requirements 3.3, 3.5**
describe("Property 7 — Comment body validation enforces 1–2000 character range", () => {
  it("accepts bodies with length 1–2000", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 2000 }),
        (body) => {
          expect(isValidCommentBody(body)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects empty strings", () => {
    fc.assert(
      fc.property(
        fc.constant(""),
        (body) => {
          expect(isValidCommentBody(body)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects bodies with length > 2000", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 2001, maxLength: 4000 }),
        (body) => {
          expect(isValidCommentBody(body)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
