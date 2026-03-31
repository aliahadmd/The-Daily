"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SubscriptionDrawerProps {
  articleSlug: string;
  userId: number | null;
}

export default function SubscriptionDrawer({ articleSlug, userId }: SubscriptionDrawerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    // Trigger animation on next frame so the initial translateY(100%) is painted first
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
    };
  }, []);

  async function handleSubscribe() {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: articleSlug }),
    });
    if (res.redirected) {
      window.location.href = res.url;
    }
  }

  return (
    <>
      {/* Gradient fade over article text just above the drawer */}
      <div
        className="fixed left-0 right-0 pointer-events-none z-40"
        style={{
          top: "calc(50vh - 120px)",
          height: "120px",
          background: "linear-gradient(to bottom, transparent, var(--background))",
        }}
      />

      {/* Semi-transparent backdrop covering the bottom half */}
      <div
        className="fixed left-0 right-0 bottom-0 z-40"
        style={{ top: "50vh", background: "rgba(10, 10, 10, 0.15)" }}
      />

      {/* Drawer */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 rounded-t-2xl shadow-2xl"
        style={{
          top: "50vh",
          background: "var(--cream)",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 400ms ease-out",
        }}
      >
        <div className="flex flex-col items-center justify-center h-full px-6 py-8 max-w-lg mx-auto text-center gap-5">
          {/* Handle bar */}
          <div className="w-10 h-1 rounded-full bg-border mb-1" />

          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--muted)" }}>
              Premium Content
            </p>
            <h2 className="text-2xl font-black tracking-tight uppercase" style={{ color: "var(--ink)" }}>
              Read the full story
            </h2>
            <p className="text-sm" style={{ color: "var(--ink-light)" }}>
              Subscribe to unlock unlimited access to all articles.
            </p>
          </div>

          {/* Price badge */}
          <div
            className="px-5 py-2 rounded-full text-sm font-bold tracking-wide border"
            style={{ borderColor: "var(--border)", color: "var(--ink)", background: "var(--cream-dark)" }}
          >
            $5 / month
          </div>

          {userId !== null ? (
            /* Authenticated non-subscriber */
            <button
              onClick={handleSubscribe}
              className="w-full max-w-xs py-3 text-sm font-semibold tracking-widest uppercase transition-opacity hover:opacity-80"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Subscribe Now
            </button>
          ) : (
            /* Unauthenticated visitor */
            <div className="flex flex-col items-center gap-3 w-full max-w-xs">
              <Link
                href={`/login?redirect=/articles/${articleSlug}`}
                className="w-full py-3 text-sm font-semibold tracking-widest uppercase text-center transition-opacity hover:opacity-80"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                Subscribe Now
              </Link>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Already have an account?{" "}
                <Link
                  href={`/login?redirect=/articles/${articleSlug}`}
                  className="font-semibold underline"
                  style={{ color: "var(--ink)" }}
                >
                  Log in
                </Link>
                {" · "}
                <Link
                  href="/register"
                  className="font-semibold underline"
                  style={{ color: "var(--ink)" }}
                >
                  Register
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
