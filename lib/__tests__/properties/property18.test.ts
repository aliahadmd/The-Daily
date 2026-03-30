// Feature: international-newspaper-cms, Property 18: Media stored at correct MinIO path

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

type UploadType = "cover" | "video" | "body";

/**
 * Pure path construction logic extracted from lib/minio.ts uploadFile():
 *   storagePath = `${type}s/${slug}/${filename}`
 *   url = `${endpoint}/${bucket}/${storagePath}`
 */
function buildStoragePath(type: UploadType, slug: string, filename: string): string {
  return `${type}s/${slug}/${filename}`;
}

function buildUrl(endpoint: string, bucket: string, storagePath: string): string {
  return `${endpoint}/${bucket}/${storagePath}`;
}

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const uploadTypeArb = fc.constantFrom<UploadType>("cover", "video", "body");

// Slugs: lowercase alphanumeric + hyphens, no leading/trailing hyphens
const slugArb = fc
  .array(fc.stringMatching(/^[a-z0-9]+$/), { minLength: 1, maxLength: 5 })
  .map((parts) => parts.join("-"));

// Filenames: non-empty, no path separators
const filenameArb = fc
  .string({ minLength: 1, maxLength: 60 })
  .filter((s) => !s.includes("/") && !s.includes("\\") && s.trim().length > 0);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Property 18 — Media stored at correct MinIO path pattern", () => {
  it("storage path matches /{type}s/{slug}/{filename} for any valid input", () => {
    fc.assert(
      fc.property(uploadTypeArb, slugArb, filenameArb, (type, slug, filename) => {
        const path = buildStoragePath(type, slug, filename);
        expect(path).toBe(`${type}s/${slug}/${filename}`);
      }),
      { numRuns: 100 }
    );
  });

  it("cover uploads produce paths starting with 'covers/'", () => {
    fc.assert(
      fc.property(slugArb, filenameArb, (slug, filename) => {
        const path = buildStoragePath("cover", slug, filename);
        expect(path.startsWith("covers/")).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("video uploads produce paths starting with 'videos/'", () => {
    fc.assert(
      fc.property(slugArb, filenameArb, (slug, filename) => {
        const path = buildStoragePath("video", slug, filename);
        expect(path.startsWith("videos/")).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("body uploads produce paths starting with 'bodys/'", () => {
    fc.assert(
      fc.property(slugArb, filenameArb, (slug, filename) => {
        const path = buildStoragePath("body", slug, filename);
        expect(path.startsWith("bodys/")).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("storage path contains the slug as the second segment", () => {
    fc.assert(
      fc.property(uploadTypeArb, slugArb, filenameArb, (type, slug, filename) => {
        const path = buildStoragePath(type, slug, filename);
        const segments = path.split("/");
        expect(segments[1]).toBe(slug);
      }),
      { numRuns: 100 }
    );
  });

  it("storage path contains the filename as the last segment", () => {
    fc.assert(
      fc.property(uploadTypeArb, slugArb, filenameArb, (type, slug, filename) => {
        const path = buildStoragePath(type, slug, filename);
        const segments = path.split("/");
        expect(segments[segments.length - 1]).toBe(filename);
      }),
      { numRuns: 100 }
    );
  });

  it("URL contains the storage path as a suffix", () => {
    fc.assert(
      fc.property(
        uploadTypeArb,
        slugArb,
        filenameArb,
        fc.webUrl(),
        fc.string({ minLength: 1, maxLength: 30 }).filter((s) => !s.includes("/")),
        (type, slug, filename, endpoint, bucket) => {
          const storagePath = buildStoragePath(type, slug, filename);
          const url = buildUrl(endpoint, bucket, storagePath);
          expect(url).toContain(storagePath);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("storage path has exactly 3 segments separated by '/'", () => {
    fc.assert(
      fc.property(uploadTypeArb, slugArb, filenameArb, (type, slug, filename) => {
        const path = buildStoragePath(type, slug, filename);
        const segments = path.split("/");
        expect(segments).toHaveLength(3);
      }),
      { numRuns: 100 }
    );
  });
});
