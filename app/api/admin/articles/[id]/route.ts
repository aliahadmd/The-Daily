import { NextRequest, NextResponse } from "next/server";
import { updateArticle, deleteArticle } from "@/lib/queries/articles";
import { deleteMediaRecord } from "@/lib/queries/media";
import { deleteFile } from "@/lib/minio";
import { validateArticleInput } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const articleId = parseInt(id, 10);
    if (isNaN(articleId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json();

    // Only validate if core fields are provided
    const hasCorFields = body.title !== undefined || body.body !== undefined || body.slug !== undefined || body.categoryId !== undefined;
    if (hasCorFields) {
      const validation = validateArticleInput(body);
      if (!validation.valid) {
        return NextResponse.json({ error: "Validation failed", details: validation.errors }, { status: 400 });
      }
    }

    await updateArticle(articleId, body);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err?.code === "23505" || err?.message?.includes("unique")) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    console.error("PUT /api/admin/articles/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const articleId = parseInt(id, 10);
    if (isNaN(articleId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const { mediaIds } = await deleteArticle(articleId);

    // Clean up associated media from MinIO and DB
    for (const mediaId of mediaIds) {
      const record = await deleteMediaRecord(mediaId);
      if (record) {
        await deleteFile(record.storagePath).catch((e) =>
          console.warn("MinIO delete failed for", record.storagePath, e)
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/articles/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
