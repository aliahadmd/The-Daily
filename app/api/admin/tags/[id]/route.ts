import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/index";
import { tags } from "@/lib/db/schema";
import { updateTag } from "@/lib/queries/taxonomy";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const tagId = parseInt(id, 10);
    if (isNaN(tagId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json();
    await updateTag(tagId, body);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err?.code === "23505" || err?.message?.includes("unique")) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    console.error("PUT /api/admin/tags/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const tagId = parseInt(id, 10);
    if (isNaN(tagId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    // article_tags and video_post_tags cascade on delete
    await db.delete(tags).where(eq(tags.id, tagId));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/tags/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
