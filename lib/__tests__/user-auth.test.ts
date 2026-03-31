import { describe, it, expect } from "vitest";
import { userSessionOptions } from "../user-auth";

describe("userSessionOptions", () => {
  it("uses the user session cookie name, not the admin cookie name", () => {
    expect(userSessionOptions.cookieName).toBe("newspaper-user-session");
  });

  it("sets httpOnly to true", () => {
    expect(userSessionOptions.cookieOptions.httpOnly).toBe(true);
  });

  it("sets sameSite to lax", () => {
    expect(userSessionOptions.cookieOptions.sameSite).toBe("lax");
  });
});
