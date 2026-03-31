import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { createUser, getUserByEmail } from "@/lib/queries/users";
import { createUserSession } from "@/lib/user-auth";
import { db } from "@/lib/db";
import { publicUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, email, password } = body ?? {};

  if (!username || !email || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters", field: "password" },
      { status: 400 }
    );
  }

  // Check for duplicate email
  const existingEmail = await getUserByEmail(email);
  if (existingEmail) {
    return NextResponse.json(
      { error: "Email already registered", field: "email" },
      { status: 400 }
    );
  }

  // Check for duplicate username
  const [existingUsername] = await db
    .select()
    .from(publicUsers)
    .where(eq(publicUsers.username, username))
    .limit(1);

  if (existingUsername) {
    return NextResponse.json(
      { error: "Username already taken", field: "username" },
      { status: 400 }
    );
  }

  try {
    const passwordHash = await hashPassword(password);
    const user = await createUser({ username, email, passwordHash });
    await createUserSession({ userId: user.id, username: user.username });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message.toLowerCase() : "";
    if (message.includes("unique")) {
      if (message.includes("username")) {
        return NextResponse.json(
          { error: "Username already taken", field: "username" },
          { status: 400 }
        );
      }
      if (message.includes("email")) {
        return NextResponse.json(
          { error: "Email already registered", field: "email" },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "Account already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }

  return NextResponse.redirect(new URL("/", request.url));
}
