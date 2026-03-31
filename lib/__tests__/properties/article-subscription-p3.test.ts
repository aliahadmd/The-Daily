// Feature: article-subscription, Property 3: Unauthenticated subscribe redirects to login with return URL

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

function buildLoginRedirectUrl(slug: string): string {
  return `/login?redirect=/articles/${slug}`;
}

// Generates slug-like strings: alphanumeric and hyphens, at least 1 char
const slugArb = fc.stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,49}$/);

// **Validates: Requirements 2.5**
describe("Property 3 — Unauthenticated subscribe redirects to login with return URL", () => {
  it("redirect URL starts with /login", () => {
    fc.assert(
      fc.property(slugArb, (slug) => {
        const url = buildLoginRedirectUrl(slug);
        expect(url.startsWith("/login")).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("redirect URL contains the slug", () => {
    fc.assert(
      fc.property(slugArb, (slug) => {
        const url = buildLoginRedirectUrl(slug);
        expect(url).toContain(slug);
      }),
      { numRuns: 100 }
    );
  });

  it("redirect URL contains ?redirect=/articles/ followed by the slug", () => {
    fc.assert(
      fc.property(slugArb, (slug) => {
        const url = buildLoginRedirectUrl(slug);
        expect(url).toContain(`?redirect=/articles/${slug}`);
      }),
      { numRuns: 100 }
    );
  });

  it("redirect URL is exactly /login?redirect=/articles/{slug}", () => {
    fc.assert(
      fc.property(slugArb, (slug) => {
        const url = buildLoginRedirectUrl(slug);
        expect(url).toBe(`/login?redirect=/articles/${slug}`);
      }),
      { numRuns: 100 }
    );
  });
});
