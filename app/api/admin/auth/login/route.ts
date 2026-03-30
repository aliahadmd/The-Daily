import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/index";
import { admins } from "@/lib/db/schema";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const username = formData.get("username") as string | null;
  const password = formData.get("password") as string | null;

  if (!username || !password) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url));
  }

  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.username, username))
    .limit(1);

  if (!admin) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url));
  }

  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url));
  }

  await createSession({ adminId: admin.id, username: admin.username });
  return NextResponse.redirect(new URL("/admin", request.url));
}
