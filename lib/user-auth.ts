import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface UserSession {
  userId: number;
  username: string;
}

export const userSessionOptions = {
  cookieName: "newspaper-user-session",
  password: process.env.USER_SESSION_SECRET!,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export async function getUserSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const session = await getIronSession<UserSession>(cookieStore, userSessionOptions);
  if (!session.userId) return null;
  return { userId: session.userId, username: session.username };
}

export async function createUserSession(data: UserSession): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<UserSession>(cookieStore, userSessionOptions);
  session.userId = data.userId;
  session.username = data.username;
  await session.save();
}

export async function destroyUserSession(): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<UserSession>(cookieStore, userSessionOptions);
  session.destroy();
}
