"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const hasError = searchParams.get("error") === "1";

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
      <div className="w-full max-w-sm">
        {/* Masthead */}
        <div className="text-center mb-8 border-b-2 pb-6" style={{ borderColor: "var(--ink)" }}>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--muted)" }}>
            Administration
          </p>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
            The Daily CMS
          </h1>
          <div className="mt-2 h-px" style={{ background: "var(--ink)" }} />
        </div>

        {/* Error banner */}
        {hasError && (
          <div
            className="mb-4 px-4 py-3 text-sm border"
            style={{ background: "#fef2f2", borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            Invalid username or password. Please try again.
          </div>
        )}

        {/* Login form */}
        <form method="POST" action="/api/admin/auth/login" className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-semibold tracking-widest uppercase mb-1"
              style={{ color: "var(--ink-light)" }}
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              className="w-full px-3 py-2 text-sm border focus:outline-none focus:ring-1"
              style={{
                background: "var(--cream-dark)",
                borderColor: "var(--border)",
                color: "var(--ink)",
                // @ts-ignore
                "--tw-ring-color": "var(--ink)",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold tracking-widest uppercase mb-1"
              style={{ color: "var(--ink-light)" }}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 text-sm border focus:outline-none focus:ring-1"
              style={{
                background: "var(--cream-dark)",
                borderColor: "var(--border)",
                color: "var(--ink)",
              }}
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 text-sm font-semibold tracking-widest uppercase transition-opacity hover:opacity-80"
            style={{ background: "var(--ink)", color: "var(--cream)" }}
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
