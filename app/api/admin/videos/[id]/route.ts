import { NextRequest, NextResponse } from "next/server";
import { updateVideoPost, deleteVideoPost } from "@/lib/queries/videos";
import { deleteMediaRecord } from "@/lib/queries/media";
import { deleteFile } from "@/lib/minio";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const postId = parseInt(id, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json();
    await updateVideoPost(postId, body);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err?.code === "23505" || err?.message?.includes("unique")) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    console.error("PUT /api/admin/videos/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const postId = parseInt(id, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const { mediaIds } = await deleteVideoPost(postId);

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
    console.error("DELETE /api/admin/videos/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
