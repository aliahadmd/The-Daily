"use client";

import { useState } from "react";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        redirect: "manual",
      });

      if (res.ok || res.type === "opaqueredirect" || res.status === 0) {
        window.location.href = "/";
        return;
      }

      if (res.redirected) {
        window.location.href = "/";
        return;
      }

      if (res.status === 401) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Invalid email or password.");
        return;
      }

      setError("An unexpected error occurred. Please try again.");
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
      <div className="w-full max-w-sm">
        {/* Masthead */}
        <div className="text-center mb-8 border-b-2 pb-6" style={{ borderColor: "var(--ink)" }}>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--muted)" }}>
            Welcome back
          </p>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
            The Daily
          </h1>
          <div className="mt-2 h-px" style={{ background: "var(--ink)" }} />
        </div>

        {/* Error banner */}
        {error && (
          <div
            className="mb-4 px-4 py-3 text-sm border"
            style={{ background: "#fef2f2", borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold tracking-widest uppercase mb-1"
              style={{ color: "var(--ink-light)" }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border focus:outline-none focus:ring-1"
              style={{
                background: "var(--cream-dark)",
                borderColor: "var(--border)",
                color: "var(--ink)",
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
              value={form.password}
              onChange={handleChange}
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
            disabled={loading}
            className="w-full py-2 text-sm font-semibold tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: "var(--ink)", color: "var(--cream)" }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs" style={{ color: "var(--muted)" }}>
          Don&apos;t have an account?{" "}
          <a href="/register" className="underline" style={{ color: "var(--ink)" }}>
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
