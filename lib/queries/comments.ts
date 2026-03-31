import { eq, and, desc, asc, sql } from "drizzle-orm";
import { db } from "../db";
import { comments, publicUsers, articles } from "../db/schema";

// ─── Write queries ────────────────────────────────────────────────────────────

export async function createComment(data: {
  articleId: number;
  userId: number;
  body: string;
}) {
  const [inserted] = await db
    .insert(comments)
    .values({
      articleId: data.articleId,
      userId: data.userId,
      body: data.body,
      status: "pending",
    })
    .returning();

  return inserted;
}

export async function updateCommentStatus(
  id: number,
  status: "approved" | "rejected"
) {
  const [updated] = await db
    .update(comments)
    .set({ status })
    .where(eq(comments.id, id))
    .returning();

  return updated;
}

export async function deleteComment(id: number): Promise<void> {
  await db.delete(comments).where(eq(comments.id, id));
}

// ─── Read queries ─────────────────────────────────────────────────────────────

export async function getApprovedCommentsByArticle(articleId: number) {
  return db
    .select({
      id: comments.id,
      body: comments.body,
      status: comments.status,
      createdAt: comments.createdAt,
      userId: comments.userId,
      articleId: comments.articleId,
      username: publicUsers.username,
    })
    .from(comments)
    .innerJoin(publicUsers, eq(comments.userId, publicUsers.id))
    .where(and(eq(comments.articleId, articleId), eq(comments.status, "approved")))
    .orderBy(asc(comments.createdAt));
}

export async function listAllComments(opts: {
  status?: "pending" | "approved" | "rejected";
  articleId?: number;
  page: number;
  pageSize: number;
}) {
  const { status, articleId, page, pageSize } = opts;
  const offset = (page - 1) * pageSize;

  const conditions = and(
    status !== undefined ? eq(comments.status, status) : undefined,
    articleId !== undefined ? eq(comments.articleId, articleId) : undefined
  );

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: comments.id,
        body: comments.body,
        status: comments.status,
        createdAt: comments.createdAt,
        userId: comments.userId,
        articleId: comments.articleId,
        username: publicUsers.username,
        articleTitle: articles.title,
      })
      .from(comments)
      .innerJoin(publicUsers, eq(comments.userId, publicUsers.id))
      .innerJoin(articles, eq(comments.articleId, articles.id))
      .where(conditions)
      .orderBy(desc(comments.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(comments)
      .where(conditions),
  ]);

  return { comments: rows, total: countResult[0]?.total ?? 0 };
}

export async function getPendingCommentCount(): Promise<number> {
  const [result] = await db
    .select({ total: sql<number>`cast(count(*) as int)` })
    .from(comments)
    .where(eq(comments.status, "pending"));

  return result?.total ?? 0;
}
