import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validateUpload } from "../minio";

// Feature: international-newspaper-cms, Property 17: Media upload validation rejects invalid type or oversized files

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_MIME_TYPES = ["video/mp4", "video/webm"];
const IMAGE_MAX_SIZE = 20 * 1024 * 1024;  // 20 MB
const VIDEO_MAX_SIZE = 500 * 1024 * 1024; // 500 MB

describe("validateUpload — Property 17", () => {
  // ── Property-based tests ──────────────────────────────────────────────────

  it("valid image MIME types with valid sizes always return { valid: true }", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...IMAGE_MIME_TYPES),
        fc.integer({ min: 0, max: IMAGE_MAX_SIZE }),
        (mimeType, size) => {
          const result = validateUpload(mimeType, size, "image");
          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("invalid MIME types for image always return { valid: false, error: string }", () => {
    const invalidImageTypes = fc.string({ minLength: 1 }).filter(
      (s) => !IMAGE_MIME_TYPES.includes(s)
    );
    fc.assert(
      fc.property(
        invalidImageTypes,
        fc.integer({ min: 0, max: IMAGE_MAX_SIZE }),
        (mimeType, size) => {
          const result = validateUpload(mimeType, size, "image");
          expect(result.valid).toBe(false);
          expect(typeof result.error).toBe("string");
          expect(result.error!.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("oversized images (> 20 MB) always return { valid: false, error: string }", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...IMAGE_MIME_TYPES),
        fc.integer({ min: IMAGE_MAX_SIZE + 1, max: IMAGE_MAX_SIZE * 10 }),
        (mimeType, size) => {
          const result = validateUpload(mimeType, size, "image");
          expect(result.valid).toBe(false);
          expect(typeof result.error).toBe("string");
          expect(result.error!.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("valid video MIME types with valid sizes always return { valid: true }", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VIDEO_MIME_TYPES),
        fc.integer({ min: 0, max: VIDEO_MAX_SIZE }),
        (mimeType, size) => {
          const result = validateUpload(mimeType, size, "video");
          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("oversized videos (> 500 MB) always return { valid: false, error: string }", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VIDEO_MIME_TYPES),
        fc.integer({ min: VIDEO_MAX_SIZE + 1, max: VIDEO_MAX_SIZE * 2 }),
        (mimeType, size) => {
          const result = validateUpload(mimeType, size, "video");
          expect(result.valid).toBe(false);
          expect(typeof result.error).toBe("string");
          expect(result.error!.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Unit tests ────────────────────────────────────────────────────────────

  it("image/jpeg with 1 MB → valid", () => {
    const result = validateUpload("image/jpeg", 1 * 1024 * 1024, "image");
    expect(result).toEqual({ valid: true });
  });

  it("image/png with exactly 20 MB → valid (boundary)", () => {
    const result = validateUpload("image/png", IMAGE_MAX_SIZE, "image");
    expect(result).toEqual({ valid: true });
  });

  it("image/png with 20 MB + 1 byte → invalid", () => {
    const result = validateUpload("image/png", IMAGE_MAX_SIZE + 1, "image");
    expect(result.valid).toBe(false);
    expect(typeof result.error).toBe("string");
  });

  it("video/mp4 with 100 MB → valid", () => {
    const result = validateUpload("video/mp4", 100 * 1024 * 1024, "video");
    expect(result).toEqual({ valid: true });
  });

  it("video/mp4 with 500 MB + 1 byte → invalid", () => {
    const result = validateUpload("video/mp4", VIDEO_MAX_SIZE + 1, "video");
    expect(result.valid).toBe(false);
    expect(typeof result.error).toBe("string");
  });

  it("application/pdf → invalid for image", () => {
    const result = validateUpload("application/pdf", 1 * 1024 * 1024, "image");
    expect(result.valid).toBe(false);
    expect(typeof result.error).toBe("string");
  });

  it("application/pdf → invalid for video", () => {
    const result = validateUpload("application/pdf", 1 * 1024 * 1024, "video");
    expect(result.valid).toBe(false);
    expect(typeof result.error).toBe("string");
  });

  it("video/mp4 submitted as image → invalid", () => {
    const result = validateUpload("video/mp4", 1 * 1024 * 1024, "image");
    expect(result.valid).toBe(false);
    expect(typeof result.error).toBe("string");
  });
});
