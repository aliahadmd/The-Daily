import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import bcrypt from "bcryptjs";
import { hashPassword, verifyPassword } from "../auth";

// Feature: international-newspaper-cms, Property 12: Password hashing is non-reversible and bcrypt-verifiable
describe("hashPassword (Property 12)", () => {
  it(
    "hash is non-reversible and bcrypt-verifiable for any password",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 72 }),
          async (password) => {
            const hash = await hashPassword(password);
            // Hash must not equal the plaintext
            expect(hash).not.toBe(password);
            // Must be a valid bcrypt hash with $2b$ prefix
            expect(hash).toMatch(/^\$2b\$/);
            // Must use cost factor >= 12 (encoded as the number after $2b$)
            const costFactor = parseInt(hash.split("$")[2], 10);
            expect(costFactor).toBeGreaterThanOrEqual(12);
            // bcrypt.compare must return true for the original password
            expect(await bcrypt.compare(password, hash)).toBe(true);
          }
        ),
        { numRuns: 10 } // bcrypt is slow; 10 iterations keeps CI fast while still testing the property
      );
    },
    60_000 // 60s timeout: 10 bcrypt hashes + 10 compares at cost 12 ≈ ~30s
  );
});

// Feature: international-newspaper-cms, Property 13: Login round-trip — valid credentials create a session, invalid do not
describe("verifyPassword (Property 13)", () => {
  it(
    "returns true for the correct password and false for any different password",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate two distinct passwords
          fc
            .tuple(
              fc.string({ minLength: 8, maxLength: 72 }),
              fc.string({ minLength: 8, maxLength: 72 })
            )
            .filter(([a, b]) => a !== b),
          async ([correctPassword, wrongPassword]) => {
            const hash = await hashPassword(correctPassword);
            // Correct password must verify successfully
            expect(await verifyPassword(correctPassword, hash)).toBe(true);
            // Wrong password must not verify
            expect(await verifyPassword(wrongPassword, hash)).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    },
    90_000 // 90s timeout: each iteration does 1 hash + 2 compares at cost 12
  );

  it(
    "returns false for a non-existent username scenario (hash mismatch)",
    async () => {
      // Simulates the case where no admin record is found — we compare against a
      // pre-computed dummy hash to avoid timing attacks. The result must always be false.
      const dummyHash = await hashPassword("__dummy_sentinel_password__");

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 72 }),
          async (attemptedPassword) => {
            expect(await verifyPassword(attemptedPassword, dummyHash)).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    },
    60_000
  );
});
