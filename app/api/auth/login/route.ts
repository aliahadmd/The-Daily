import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/queries/users";
import { verifyPassword } from "@/lib/auth";
import { createUserSession } from "@/lib/user-auth";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const user = await getUserByEmail(email);

  // Constant-time: always verify even if user not found (use a dummy hash)
  const dummyHash = "$2a$12$invalidhashfortimingprotection000000000000000000000000";
  const passwordValid = await verifyPassword(password, user?.passwordHash ?? dummyHash);

  if (!user || !passwordValid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (user.status === "banned") {
    return NextResponse.json({ error: "Account suspended" }, { status: 401 });
  }

  await createUserSession({ userId: user.id, username: user.username });

  const redirectTo = request.nextUrl.searchParams.get("redirect") ?? "/";
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
