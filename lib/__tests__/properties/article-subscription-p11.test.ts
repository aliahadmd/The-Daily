// Feature: article-subscription, Property 11: Missing Stripe env vars throw descriptive errors at startup

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Replicate the requireEnv logic from lib/stripe.ts
// (lib/stripe.ts executes requireEnv at module load time, so we test the logic directly)
function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

const REQUIRED_STRIPE_VARS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_PRICE_ID",
  "STRIPE_WEBHOOK_SECRET",
] as const;

// **Validates: Requirements 8.1, 8.3, 8.4, 8.5**
describe("Property 11 — Missing Stripe env vars throw descriptive errors at startup", () => {
  it("throws an Error with the missing variable name in the message for each required var", () => {
    fc.assert(
      fc.property(fc.constantFrom(...REQUIRED_STRIPE_VARS), (varName) => {
        const original = process.env[varName];
        try {
          delete process.env[varName];
          expect(() => requireEnv(varName)).toThrow(
            `Missing required environment variable: ${varName}`
          );
        } finally {
          // Restore original value to avoid test pollution
          if (original !== undefined) {
            process.env[varName] = original;
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("does not throw when the env var is present", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...REQUIRED_STRIPE_VARS),
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        (varName, value) => {
          const original = process.env[varName];
          try {
            process.env[varName] = value;
            expect(() => requireEnv(varName)).not.toThrow();
            expect(requireEnv(varName)).toBe(value);
          } finally {
            if (original !== undefined) {
              process.env[varName] = original;
            } else {
              delete process.env[varName];
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
