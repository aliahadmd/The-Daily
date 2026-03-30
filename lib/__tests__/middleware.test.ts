import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

vi.mock("iron-session", () => ({
  getIronSession: vi.fn(),
}));

// Import middleware after mocking iron-session
import { middleware } from "../../middleware";

const mockGetIronSession = vi.mocked(getIronSession);

function makeRequest(pathname: string): NextRequest {
  return new NextRequest(new URL(pathname, "http://localhost:3000"));
}

function mockSession(adminId: number | undefined) {
  mockGetIronSession.mockResolvedValue({ adminId } as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// Feature: international-newspaper-cms, Property 11: Unauthenticated requests to admin routes are rejected
describe("middleware unit tests (Property 11)", () => {
  it("request to /admin/login passes through without redirect", async () => {
    const req = makeRequest("/admin/login");
    const res = await middleware(req);
    // Should not be a redirect
    expect(res.status).not.toBe(307);
    expect(res.status).not.toBe(302);
    // getIronSession should not be called for the login route
    expect(mockGetIronSession).not.toHaveBeenCalled();
  });

  it("request to /admin without session redirects to /admin/login", async () => {
    mockSession(undefined);
    const req = makeRequest("/admin");
    const res = await middleware(req);
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get("location")).toContain("/admin/login");
  });

  it("request to /admin/articles without session redirects to /admin/login", async () => {
    mockSession(undefined);
    const req = makeRequest("/admin/articles");
    const res = await middleware(req);
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get("location")).toContain("/admin/login");
  });

  it("request to /admin with valid session passes through", async () => {
    mockSession(1);
    const req = makeRequest("/admin");
    const res = await middleware(req);
    expect(res.status).not.toBeGreaterThanOrEqual(300);
  });
});

// Feature: international-newspaper-cms, Property 11: Unauthenticated requests to admin routes are rejected
describe("middleware property-based tests (Property 11)", () => {
  it("any /admin/* path (except /admin/login) without session always redirects to /admin/login", async () => {
    // Arbitrary path segments: lowercase letters and digits only to keep paths valid
    const pathSegmentArb = fc.stringMatching(/^[a-z0-9]+$/);
    const adminPathArb = fc
      .array(pathSegmentArb, { minLength: 1, maxLength: 4 })
      .map((segments) => "/admin/" + segments.join("/"))
      .filter((path) => path !== "/admin/login");

    await fc.assert(
      fc.asyncProperty(adminPathArb, async (path) => {
        mockSession(undefined);
        const req = makeRequest(path);
        const res = await middleware(req);
        expect(res.status).toBeGreaterThanOrEqual(300);
        expect(res.status).toBeLessThan(400);
        expect(res.headers.get("location")).toContain("/admin/login");
      }),
      { numRuns: 100 }
    );
  });

  it("requests to /admin/login always pass through regardless of session state", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(), // whether adminId is set or not
        async (hasSession) => {
          if (hasSession) {
            mockSession(1);
          }
          // For /admin/login, iron-session is never called, so no need to mock
          const req = makeRequest("/admin/login");
          const res = await middleware(req);
          expect(res.status).not.toBeGreaterThanOrEqual(300);
        }
      ),
      { numRuns: 100 }
    );
  });
});
