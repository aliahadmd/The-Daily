import { NextRequest, NextResponse } from "next/server";
import { validateUpload, uploadFile } from "@/lib/minio";
import { createMediaRecord } from "@/lib/queries/media";

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const type = formData.get("type") as "cover" | "video" | "body" | null;
  const slug = formData.get("slug") as string | null;

  if (!file || !type || !slug) {
    return NextResponse.json({ error: "Missing required fields: file, type, slug" }, { status: 400 });
  }

  if (!["cover", "video", "body"].includes(type)) {
    return NextResponse.json({ error: "Invalid type. Must be cover, video, or body" }, { status: 400 });
  }

  const accept = type === "video" ? "video" : "image";
  const validation = validateUpload(file.type, file.size, accept);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, storagePath } = await uploadFile(type, slug, {
      buffer,
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    });

    const { id: mediaId } = await createMediaRecord({
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      url,
      storagePath,
    });

    return NextResponse.json({ url, mediaId });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload or database error" }, { status: 500 });
  }
}
