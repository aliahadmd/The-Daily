import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { slugify } from "../slugify";

// Feature: international-newspaper-cms, Property 19: Slug generation produces valid URL-safe strings
describe("slugify", () => {
  it("produces valid URL-safe strings for any input (Property 19)", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (name) => {
        const slug = slugify(name);
        // Must match: lowercase alphanumeric + hyphens, no leading/trailing hyphens, no consecutive hyphens
        expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      }),
      { numRuns: 100 }
    );
  });

  it("lowercases the input", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips diacritics", () => {
    expect(slugify("Ñoño")).toBe("nono");
    expect(slugify("café")).toBe("cafe");
    expect(slugify("über")).toBe("uber");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("breaking news today")).toBe("breaking-news-today");
  });

  it("collapses consecutive hyphens", () => {
    expect(slugify("hello---world")).toBe("hello-world");
    expect(slugify("a  b")).toBe("a-b");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("-hello-")).toBe("hello");
    expect(slugify("---test---")).toBe("test");
  });

  it("handles special characters", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
    expect(slugify("100% Pure")).toBe("100-pure");
  });

  it("returns 'untitled' for inputs that produce an empty string", () => {
    expect(slugify("---")).toBe("untitled");
    expect(slugify("!!!")).toBe("untitled");
    expect(slugify("   ")).toBe("untitled");
  });

  it("handles unicode letters that are not diacritics (non-latin)", () => {
    // Chinese characters have no latin equivalent — they become hyphens, then trimmed
    const slug = slugify("中文");
    expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$|^untitled$/);
  });
});
