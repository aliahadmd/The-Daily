import { eq, or, ilike, sql } from "drizzle-orm";
import { db } from "../db";
import { publicUsers, comments } from "../db/schema";

// ─── Write queries ────────────────────────────────────────────────────────────

export async function createUser(data: {
  username: string;
  email: string;
  passwordHash: string;
}) {
  const [inserted] = await db
    .insert(publicUsers)
    .values({
      username: data.username,
      email: data.email,
      passwordHash: data.passwordHash,
    })
    .returning();

  return inserted;
}

export async function updateUserStatus(id: number, status: "active" | "banned") {
  const [updated] = await db
    .update(publicUsers)
    .set({ status })
    .where(eq(publicUsers.id, id))
    .returning();

  return updated;
}

// ─── Read queries ─────────────────────────────────────────────────────────────

export async function getUserByEmail(email: string) {
  const rows = await db
    .select()
    .from(publicUsers)
    .where(eq(publicUsers.email, email))
    .limit(1);

  return rows[0] ?? null;
}

export async function getUserById(id: number) {
  const rows = await db
    .select()
    .from(publicUsers)
    .where(eq(publicUsers.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function listUsers(page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: publicUsers.id,
        username: publicUsers.username,
        email: publicUsers.email,
        status: publicUsers.status,
        createdAt: publicUsers.createdAt,
        commentCount: sql<number>`cast(count(${comments.id}) as int)`,
      })
      .from(publicUsers)
      .leftJoin(comments, eq(comments.userId, publicUsers.id))
      .groupBy(publicUsers.id)
      .orderBy(publicUsers.createdAt)
      .limit(pageSize)
      .offset(offset),
    db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(publicUsers),
  ]);

  return { users: rows, total: countResult[0]?.total ?? 0 };
}

export async function searchUsers(query: string, page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;
  const pattern = `%${query}%`;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: publicUsers.id,
        username: publicUsers.username,
        email: publicUsers.email,
        status: publicUsers.status,
        createdAt: publicUsers.createdAt,
        commentCount: sql<number>`cast(count(${comments.id}) as int)`,
      })
      .from(publicUsers)
      .leftJoin(comments, eq(comments.userId, publicUsers.id))
      .where(or(ilike(publicUsers.username, pattern), ilike(publicUsers.email, pattern)))
      .groupBy(publicUsers.id)
      .orderBy(publicUsers.createdAt)
      .limit(pageSize)
      .offset(offset),
    db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(publicUsers)
      .where(or(ilike(publicUsers.username, pattern), ilike(publicUsers.email, pattern))),
  ]);

  return { users: rows, total: countResult[0]?.total ?? 0 };
}
