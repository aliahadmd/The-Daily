import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import {
  upsertSubscription,
  getSubscriptionByStripeSubscriptionId,
} from "@/lib/queries/subscriptions";
import { getUserById } from "@/lib/queries/users";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const publicUserId = session.metadata?.publicUserId;
    const stripeCustomerId = session.customer as string;
    const stripeSubscriptionId = session.subscription as string;

    if (!publicUserId) {
      console.warn("checkout.session.completed: missing publicUserId in metadata");
      return NextResponse.json({ received: true });
    }

    const user = await getUserById(parseInt(publicUserId, 10));
    if (!user) {
      console.warn(`checkout.session.completed: no user found for publicUserId=${publicUserId}`);
      return NextResponse.json({ received: true });
    }

    await upsertSubscription({
      userId: user.id,
      stripeCustomerId,
      stripeSubscriptionId,
      status: "active",
    });
  } else if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const existing = await getSubscriptionByStripeSubscriptionId(subscription.id);

    if (!existing) {
      console.warn(`customer.subscription.deleted: no subscription found for id=${subscription.id}`);
      return NextResponse.json({ received: true });
    }

    await upsertSubscription({
      userId: existing.userId,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      status: "canceled",
    });
  } else if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object;
    const existing = await getSubscriptionByStripeSubscriptionId(subscription.id);

    if (!existing) {
      console.warn(`customer.subscription.updated: no subscription found for id=${subscription.id}`);
      return NextResponse.json({ received: true });
    }

    const status =
      subscription.status === "active" ? "active" : "canceled";

    await upsertSubscription({
      userId: existing.userId,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      status,
    });
  } else {
    console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
