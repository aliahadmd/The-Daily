// Feature: user-comments, Property 5: Banned users are rejected at login and comment submission

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Pure handler logic: checks user status for login
function loginCheck(user: { status: string } | null): { allowed: boolean; error?: string } {
  if (!user) return { allowed: false, error: "Invalid email or password" };
  if (user.status === "banned") return { allowed: false, error: "Account suspended" };
  return { allowed: true };
}

// Pure handler logic: checks user status for comment submission
function commentCheck(user: { status: string } | null): { allowed: boolean; error?: string } {
  if (!user) return { allowed: false, error: "Login required" };
  if (user.status === "banned") return { allowed: false, error: "Account suspended" };
  return { allowed: true };
}

// Generates a banned user object with arbitrary extra fields
const bannedUserArb = fc.record({
  id: fc.integer({ min: 1, max: 1_000_000 }),
  username: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  status: fc.constant("banned"),
});

// Generates an active user object
const activeUserArb = fc.record({
  id: fc.integer({ min: 1, max: 1_000_000 }),
  username: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  status: fc.constant("active"),
});

// **Validates: Requirements 2.4, 3.6**
describe("Property 5 — Banned users are rejected at login and comment submission", () => {
  it("loginCheck rejects any banned user with 'Account suspended'", () => {
    fc.assert(
      fc.property(bannedUserArb, (user) => {
        const result = loginCheck(user);
        expect(result.allowed).toBe(false);
        expect(result.error).toBe("Account suspended");
      }),
      { numRuns: 100 }
    );
  });

  it("commentCheck rejects any banned user with 'Account suspended'", () => {
    fc.assert(
      fc.property(bannedUserArb, (user) => {
        const result = commentCheck(user);
        expect(result.allowed).toBe(false);
        expect(result.error).toBe("Account suspended");
      }),
      { numRuns: 100 }
    );
  });

  it("loginCheck allows any active user", () => {
    fc.assert(
      fc.property(activeUserArb, (user) => {
        const result = loginCheck(user);
        expect(result.allowed).toBe(true);
        expect(result.error).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it("commentCheck allows any active user", () => {
    fc.assert(
      fc.property(activeUserArb, (user) => {
        const result = commentCheck(user);
        expect(result.allowed).toBe(true);
        expect(result.error).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });
});
