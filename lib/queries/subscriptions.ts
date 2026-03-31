import { eq } from "drizzle-orm";
import { db } from "../db";
import { subscriptions } from "../db/schema";

export async function getSubscriptionByUserId(userId: number) {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));

  return rows[0] ?? null;
}

export async function upsertSubscription(data: {
  userId: number;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: "active" | "canceled";
}) {
  await db
    .insert(subscriptions)
    .values({
      userId: data.userId,
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      status: data.status,
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        status: data.status,
        updatedAt: new Date(),
      },
    });
}

export async function getSubscriptionByStripeSubscriptionId(
  stripeSubscriptionId: string
) {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));

  return rows[0] ?? null;
}
