import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";
import { stripe, STRIPE_PRICE_ID } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const { slug } = await request.json();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${baseUrl}/articles/${slug}?subscribed=true`,
      cancel_url: `${baseUrl}/articles/${slug}`,
      metadata: { publicUserId: String(session.userId) },
    });

    return NextResponse.redirect(checkoutSession.url!, 302);
  } catch {
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
