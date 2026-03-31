// Feature: user-comments, Property 12: XSS sanitization strips all HTML tags from comment body

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { stripHtml } from "../../sanitize";

// Generates a valid HTML tag name (letters only, no spaces)
const tagNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{0,9}$/);

// Generates a well-formed HTML tag string like <b>text</b> or <script>...</script>
const htmlTaggedStringArb = fc.tuple(
  tagNameArb,
  fc.string({ minLength: 0, maxLength: 40 }).filter((s) => !s.includes("<") && !s.includes(">"))
).map(([tag, content]) => `<${tag}>${content}</${tag}>`);

// Generates strings that contain at least one well-formed HTML tag
const stringWithTagsArb = fc.tuple(
  fc.string({ minLength: 0, maxLength: 20 }).filter((s) => !s.includes("<") && !s.includes(">")),
  htmlTaggedStringArb,
  fc.string({ minLength: 0, maxLength: 20 }).filter((s) => !s.includes("<") && !s.includes(">"))
).map(([pre, tag, post]) => pre + tag + post);

// **Validates: Requirements 7.5**
describe("Property 12 — XSS sanitization strips all HTML tags from comment body", () => {
  it("result contains no < or > characters when input contains well-formed HTML tags", () => {
    fc.assert(
      fc.property(stringWithTagsArb, (input) => {
        const result = stripHtml(input);
        expect(result).not.toMatch(/[<>]/);
      }),
      { numRuns: 100 }
    );
  });

  it("result contains no < characters (opening tag brackets are always removed)", () => {
    fc.assert(
      fc.property(stringWithTagsArb, (input) => {
        const result = stripHtml(input);
        expect(result).not.toMatch(/</);
      }),
      { numRuns: 100 }
    );
  });

  it("preserves non-tag text content surrounding tags", () => {
    fc.assert(
      fc.property(
        // text that has no angle brackets and is not purely whitespace
        fc.string({ minLength: 1, maxLength: 30 })
          .filter((s) => !s.includes("<") && !s.includes(">") && s.trim().length > 0),
        tagNameArb,
        (text, tag) => {
          // Place text AFTER the tag so trim() doesn't eat it
          const input = `<${tag}>${text}`;
          const result = stripHtml(input);
          expect(result).toContain(text.trim());
        }
      ),
      { numRuns: 100 }
    );
  });

  it("stripping is idempotent — applying stripHtml twice yields the same result", () => {
    fc.assert(
      fc.property(stringWithTagsArb, (input) => {
        const once = stripHtml(input);
        const twice = stripHtml(once);
        expect(twice).toBe(once);
      }),
      { numRuns: 100 }
    );
  });
});
