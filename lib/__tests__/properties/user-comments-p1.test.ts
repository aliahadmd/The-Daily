// Feature: user-comments, Property 1: Password hashing never stores plaintext

import { describe, it } from "vitest";
import * as fc from "fast-check";
import { hashPassword } from "../../auth";

// **Validates: Requirements 1.6**
// Note: bcrypt cost factor 12 takes ~150ms per hash; 100 runs × 3 properties = ~45s total.
// Each `it` block is given a generous timeout to accommodate this.
describe("Property 1 — Password hashing never stores plaintext", () => {
  it("hashed password does not equal the original password", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (password) => {
          const hash = await hashPassword(password);
          return hash !== password;
        }
      ),
      { numRuns: 100 }
    );
  }, 60_000);

  it("hashed password is a valid bcrypt hash (starts with $2b$ or $2a$)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (password) => {
          const hash = await hashPassword(password);
          return hash.startsWith("$2b$") || hash.startsWith("$2a$");
        }
      ),
      { numRuns: 100 }
    );
  }, 60_000);

  it("hashed password uses cost factor 12", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (password) => {
          const hash = await hashPassword(password);
          return hash.startsWith("$2b$12$") || hash.startsWith("$2a$12$");
        }
      ),
      { numRuns: 100 }
    );
  }, 60_000);
});
