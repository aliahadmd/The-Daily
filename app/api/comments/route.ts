import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-auth";
import { getUserById } from "@/lib/queries/users";
import { checkRateLimit } from "@/lib/rate-limiter";
import { stripHtml } from "@/lib/sanitize";
import { createComment } from "@/lib/queries/comments";

export async function POST(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const user = await getUserById(session.userId);
  if (user?.status === "banned") {
    return NextResponse.json({ error: "Account suspended" }, { status: 403 });
  }

  const { allowed } = checkRateLimit(session.userId);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many comments. Try again in a minute." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { articleId, body: commentBody } = body ?? {};

  if (!commentBody || commentBody.length < 1 || commentBody.length > 2000) {
    return NextResponse.json(
      { error: "Comment must be between 1 and 2000 characters", field: "body" },
      { status: 422 }
    );
  }

  const sanitized = stripHtml(commentBody);
  const comment = await createComment({
    articleId,
    userId: session.userId,
    body: sanitized,
  });

  return NextResponse.json({ id: comment.id, status: "pending" }, { status: 201 });
}
