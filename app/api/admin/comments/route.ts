import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listAllComments } from "@/lib/queries/comments";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") as "pending" | "approved" | "rejected" | null;
  const articleIdParam = searchParams.get("articleId");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10));

  const articleId = articleIdParam ? parseInt(articleIdParam, 10) : undefined;

  try {
    const result = await listAllComments({
      status: status ?? undefined,
      articleId,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/admin/comments", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
