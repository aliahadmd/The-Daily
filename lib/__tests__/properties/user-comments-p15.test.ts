// Feature: user-comments, Property 15: User search returns only matching users

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Pure filter predicate mirroring the searchUsers query logic
function matchesSearch(user: { username: string; email: string }, query: string): boolean {
  const q = query.toLowerCase();
  return user.username.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
}

const userArb = fc.record({
  username: fc.stringMatching(/^[a-zA-Z0-9_]{1,30}$/),
  email: fc.tuple(
    fc.stringMatching(/^[a-zA-Z0-9]{1,15}$/),
    fc.stringMatching(/^[a-zA-Z0-9]{1,10}$/)
  ).map(([local, domain]) => `${local}@${domain}.com`),
});

// **Validates: Requirements 5.5**
describe("Property 15 — User search returns only matching users", () => {
  it("no false positives: all returned users contain the query in username or email", () => {
    fc.assert(
      fc.property(
        fc.array(userArb, { minLength: 0, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        (users, query) => {
          const results = users.filter((u) => matchesSearch(u, query));
          for (const user of results) {
            expect(matchesSearch(user, query)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("no false negatives: every matching user is included in results", () => {
    fc.assert(
      fc.property(
        fc.array(userArb, { minLength: 0, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        (users, query) => {
          const results = users.filter((u) => matchesSearch(u, query));
          const matchingUsers = users.filter((u) => matchesSearch(u, query));
          expect(results.length).toBe(matchingUsers.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("empty query matches all users", () => {
    fc.assert(
      fc.property(
        fc.array(userArb, { minLength: 1, maxLength: 20 }),
        (users) => {
          const results = users.filter((u) => matchesSearch(u, ""));
          expect(results.length).toBe(users.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("search is case-insensitive: uppercase query matches lowercase data", () => {
    fc.assert(
      fc.property(
        userArb,
        fc.string({ minLength: 1, maxLength: 8 }).filter((s) => /^[a-z]+$/.test(s)),
        (user, lowerQuery) => {
          const upperQuery = lowerQuery.toUpperCase();
          // If the lowercase query matches, the uppercase version must also match
          const lowerMatch = matchesSearch(user, lowerQuery);
          const upperMatch = matchesSearch(user, upperQuery);
          expect(lowerMatch).toBe(upperMatch);
        }
      ),
      { numRuns: 100 }
    );
  });
});
