"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/auth/register", {
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

      const data = await res.json().catch(() => ({}));
      if (data.field) {
        setErrors({ [data.field]: data.error });
      } else {
        setErrors({ general: data.error || "Registration failed. Please try again." });
      }
    } catch {
      setErrors({ general: "An unexpected error occurred." });
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
            Join the conversation
          </p>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
            The Daily
          </h1>
          <div className="mt-2 h-px" style={{ background: "var(--ink)" }} />
        </div>

        {/* General error banner */}
        {errors.general && (
          <div
            className="mb-4 px-4 py-3 text-sm border"
            style={{ background: "#fef2f2", borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              value={form.username}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border focus:outline-none focus:ring-1"
              style={{
                background: "var(--cream-dark)",
                borderColor: errors.username ? "var(--accent)" : "var(--border)",
                color: "var(--ink)",
              }}
            />
            {errors.username && (
              <p className="mt-1 text-xs" style={{ color: "var(--accent)" }}>
                {errors.username}
              </p>
            )}
          </div>

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
                borderColor: errors.email ? "var(--accent)" : "var(--border)",
                color: "var(--ink)",
              }}
            />
            {errors.email && (
              <p className="mt-1 text-xs" style={{ color: "var(--accent)" }}>
                {errors.email}
              </p>
            )}
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
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border focus:outline-none focus:ring-1"
              style={{
                background: "var(--cream-dark)",
                borderColor: errors.password ? "var(--accent)" : "var(--border)",
                color: "var(--ink)",
              }}
            />
            {errors.password && (
              <p className="mt-1 text-xs" style={{ color: "var(--accent)" }}>
                {errors.password}
              </p>
            )}
            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
              Must be at least 8 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-sm font-semibold tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: "var(--ink)", color: "var(--cream)" }}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs" style={{ color: "var(--muted)" }}>
          Already have an account?{" "}
          <a href="/login" className="underline" style={{ color: "var(--ink)" }}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
