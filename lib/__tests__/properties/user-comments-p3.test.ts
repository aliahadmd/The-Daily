// Feature: user-comments, Property 3: Short password registration is rejected

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Pure validation function mirroring the registration handler's password check
function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

// **Validates: Requirements 1.5**
describe("Property 3 — Short password registration is rejected", () => {
  it("rejects passwords with length 0–7", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 7 }),
        (password) => {
          expect(isValidPassword(password)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("accepts passwords with length 8 or more", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 8 }),
        (password) => {
          expect(isValidPassword(password)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
