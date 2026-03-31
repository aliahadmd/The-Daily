// Feature: article-subscription, Property 2: Checkout session URLs contain the article slug

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

function buildCheckoutUrls(baseUrl: string, slug: string) {
  return {
    success_url: `${baseUrl}/articles/${slug}?subscribed=true`,
    cancel_url: `${baseUrl}/articles/${slug}`,
  };
}

// Generates slug-like strings: alphanumeric and hyphens, at least 1 char
const slugArb = fc.stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,49}$/);

const baseUrlArb = fc.oneof(
  fc.constant("https://example.com"),
  fc.constant("http://localhost:3000"),
  fc.constant("https://thedaily.news")
);

// **Validates: Requirements 2.3, 2.4**
describe("Property 2 — Checkout session URLs contain the article slug", () => {
  it("success_url contains the slug as a substring", () => {
    fc.assert(
      fc.property(baseUrlArb, slugArb, (baseUrl, slug) => {
        const { success_url } = buildCheckoutUrls(baseUrl, slug);
        expect(success_url).toContain(slug);
      }),
      { numRuns: 100 }
    );
  });

  it("cancel_url contains the slug as a substring", () => {
    fc.assert(
      fc.property(baseUrlArb, slugArb, (baseUrl, slug) => {
        const { cancel_url } = buildCheckoutUrls(baseUrl, slug);
        expect(cancel_url).toContain(slug);
      }),
      { numRuns: 100 }
    );
  });

  it("success_url contains /articles/ prefix before the slug", () => {
    fc.assert(
      fc.property(baseUrlArb, slugArb, (baseUrl, slug) => {
        const { success_url } = buildCheckoutUrls(baseUrl, slug);
        expect(success_url).toContain(`/articles/${slug}`);
      }),
      { numRuns: 100 }
    );
  });

  it("cancel_url contains /articles/ prefix before the slug", () => {
    fc.assert(
      fc.property(baseUrlArb, slugArb, (baseUrl, slug) => {
        const { cancel_url } = buildCheckoutUrls(baseUrl, slug);
        expect(cancel_url).toContain(`/articles/${slug}`);
      }),
      { numRuns: 100 }
    );
  });
});
