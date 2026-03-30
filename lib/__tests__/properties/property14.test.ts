// Feature: international-newspaper-cms, Property 14: Article save validation rejects incomplete records
//
// NOTE: Full property-based coverage of this property is already provided in:
//   lib/__tests__/queries/articles.test.ts — "validateArticleInput" describe block
//
// That file tests:
//   - accepts a fully valid input
//   - rejects when title/body/categoryId/slug/authorName is empty or whitespace-only
//   - property: any input missing a required field is invalid (100 runs)
//   - property: fully populated input with non-empty fields is valid (100 runs)
//
// This file adds a reference test that imports and exercises the same function
// to confirm the contract from the properties directory.

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validateArticleInput } from "../../validation";

describe("Property 14 — Article save validation rejects incomplete records (reference)", () => {
  it("rejects any input where at least one required field is missing or whitespace", () => {
    // Feature: international-newspaper-cms, Property 14: Article save validation rejects incomplete records
    const missingFieldArb = fc.oneof(
      // missing title
      fc.record({ body: fc.string({ minLength: 1 }), categoryId: fc.integer({ min: 1 }), slug: fc.string({ minLength: 1 }), authorName: fc.string({ minLength: 1 }) }),
      // empty title
      fc.record({ title: fc.constant(""), body: fc.string({ minLength: 1 }), categoryId: fc.integer({ min: 1 }), slug: fc.string({ minLength: 1 }), authorName: fc.string({ minLength: 1 }) }),
      // whitespace title
      fc.record({ title: fc.constant("   "), body: fc.string({ minLength: 1 }), categoryId: fc.integer({ min: 1 }), slug: fc.string({ minLength: 1 }), authorName: fc.string({ minLength: 1 }) }),
      // missing body
      fc.record({ title: fc.string({ minLength: 1 }), categoryId: fc.integer({ min: 1 }), slug: fc.string({ minLength: 1 }), authorName: fc.string({ minLength: 1 }) }),
      // missing slug
      fc.record({ title: fc.string({ minLength: 1 }), body: fc.string({ minLength: 1 }), categoryId: fc.integer({ min: 1 }), authorName: fc.string({ minLength: 1 }) }),
    );

    fc.assert(
      fc.property(missingFieldArb, (input) => {
        const result = validateArticleInput(input as Parameters<typeof validateArticleInput>[0]);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it("accepts any input where all required fields are non-empty and non-whitespace", () => {
    // Feature: international-newspaper-cms, Property 14: Article save validation rejects incomplete records
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          body: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          categoryId: fc.integer({ min: 1 }),
          slug: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          authorName: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        }),
        (input) => {
          const result = validateArticleInput(input);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
