import { NextRequest, NextResponse } from "next/server";
import { deleteMediaRecord } from "@/lib/queries/media";
import { deleteFile } from "@/lib/minio";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const mediaId = parseInt(id, 10);
    if (isNaN(mediaId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const record = await deleteMediaRecord(mediaId);
    if (!record) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    await deleteFile(record.storagePath).catch((e) =>
      console.warn("MinIO delete failed for", record.storagePath, e)
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/media/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
