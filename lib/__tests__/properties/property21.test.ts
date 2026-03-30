// Feature: international-newspaper-cms, Property 21: Video post render type matches source type

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

interface VideoPost {
  videoMediaId: number | null;   // uploaded file → HTML5 <video>
  videoEmbedUrl: string | null;  // external URL → <iframe>
  videoMediaUrl: string | null;  // resolved URL for videoMediaId
}

type RenderType = "html5-video" | "iframe" | "none";

/**
 * Pure render-type decision logic mirroring app/videos/[slug]/page.tsx:
 *   if videoEmbedUrl → iframe
 *   else if videoMediaUrl → html5-video
 *   else → none (show cover image or nothing)
 */
function resolveRenderType(post: VideoPost): RenderType {
  if (post.videoEmbedUrl) return "iframe";
  if (post.videoMediaUrl) return "html5-video";
  return "none";
}

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const nonEmptyUrlArb = fc.webUrl();
const nonEmptyIdArb = fc.integer({ min: 1, max: 1_000_000 });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Property 21 — Video post render type matches source type", () => {
  it("videoEmbedUrl set → render type is iframe", () => {
    fc.assert(
      fc.property(nonEmptyUrlArb, (embedUrl) => {
        const post: VideoPost = { videoMediaId: null, videoEmbedUrl: embedUrl, videoMediaUrl: null };
        expect(resolveRenderType(post)).toBe("iframe");
      }),
      { numRuns: 100 }
    );
  });

  it("videoMediaId set (no embedUrl) → render type is html5-video", () => {
    fc.assert(
      fc.property(nonEmptyIdArb, nonEmptyUrlArb, (mediaId, mediaUrl) => {
        const post: VideoPost = { videoMediaId: mediaId, videoEmbedUrl: null, videoMediaUrl: mediaUrl };
        expect(resolveRenderType(post)).toBe("html5-video");
      }),
      { numRuns: 100 }
    );
  });

  it("neither set → render type is none", () => {
    const post: VideoPost = { videoMediaId: null, videoEmbedUrl: null, videoMediaUrl: null };
    expect(resolveRenderType(post)).toBe("none");
  });

  it("embedUrl takes priority over videoMediaId when both are set", () => {
    fc.assert(
      fc.property(nonEmptyUrlArb, nonEmptyIdArb, nonEmptyUrlArb, (embedUrl, mediaId, mediaUrl) => {
        const post: VideoPost = { videoMediaId: mediaId, videoEmbedUrl: embedUrl, videoMediaUrl: mediaUrl };
        // embedUrl wins → iframe
        expect(resolveRenderType(post)).toBe("iframe");
      }),
      { numRuns: 100 }
    );
  });

  it("render type is never both iframe and html5-video simultaneously", () => {
    fc.assert(
      fc.property(
        fc.option(nonEmptyUrlArb, { nil: null }),
        fc.option(nonEmptyIdArb, { nil: null }),
        fc.option(nonEmptyUrlArb, { nil: null }),
        (embedUrl, mediaId, mediaUrl) => {
          const post: VideoPost = { videoMediaId: mediaId, videoEmbedUrl: embedUrl, videoMediaUrl: mediaUrl };
          const renderType = resolveRenderType(post);
          // Mutually exclusive: can't be both
          const isIframe = renderType === "iframe";
          const isHtml5 = renderType === "html5-video";
          expect(isIframe && isHtml5).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("result is always one of the three valid render types", () => {
    fc.assert(
      fc.property(
        fc.option(nonEmptyUrlArb, { nil: null }),
        fc.option(nonEmptyIdArb, { nil: null }),
        fc.option(nonEmptyUrlArb, { nil: null }),
        (embedUrl, mediaId, mediaUrl) => {
          const post: VideoPost = { videoMediaId: mediaId, videoEmbedUrl: embedUrl, videoMediaUrl: mediaUrl };
          const renderType = resolveRenderType(post);
          expect(["iframe", "html5-video", "none"]).toContain(renderType);
        }
      ),
      { numRuns: 100 }
    );
  });
});
