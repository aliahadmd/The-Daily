import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateCommentStatus, deleteComment } from "@/lib/queries/comments";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  try {
    const { id } = await params;
    const commentId = parseInt(id, 10);
    if (isNaN(commentId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const { status } = await req.json();
    const updated = await updateCommentStatus(commentId, status);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/admin/comments/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  try {
    const { id } = await params;
    const commentId = parseInt(id, 10);
    if (isNaN(commentId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await deleteComment(commentId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("DELETE /api/admin/comments/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
