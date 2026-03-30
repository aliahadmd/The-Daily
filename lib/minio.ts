import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT ?? "";
const BUCKET = process.env.MINIO_BUCKET ?? "newspaper-media";

export const s3Client = new S3Client({
  endpoint: MINIO_ENDPOINT,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY ?? "",
    secretAccessKey: process.env.MINIO_SECRET_KEY ?? "",
  },
  region: "us-east-1",
  forcePathStyle: true,
});

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_MIME_TYPES = ["video/mp4", "video/webm"];
const IMAGE_MAX_SIZE = 20 * 1024 * 1024;  // 20MB
const VIDEO_MAX_SIZE = 500 * 1024 * 1024; // 500MB

export function validateUpload(
  mimeType: string,
  sizeBytes: number,
  accept: "image" | "video"
): { valid: boolean; error?: string } {
  if (accept === "image") {
    if (!IMAGE_MIME_TYPES.includes(mimeType)) {
      return { valid: false, error: `Unsupported image type: ${mimeType}. Allowed: ${IMAGE_MIME_TYPES.join(", ")}` };
    }
    if (sizeBytes > IMAGE_MAX_SIZE) {
      return { valid: false, error: `Image exceeds maximum size of 20MB` };
    }
  } else {
    if (!VIDEO_MIME_TYPES.includes(mimeType)) {
      return { valid: false, error: `Unsupported video type: ${mimeType}. Allowed: ${VIDEO_MIME_TYPES.join(", ")}` };
    }
    if (sizeBytes > VIDEO_MAX_SIZE) {
      return { valid: false, error: `Video exceeds maximum size of 500MB` };
    }
  }
  return { valid: true };
}

export async function uploadFile(
  type: "cover" | "video" | "body",
  slug: string,
  file: { buffer: Buffer; filename: string; mimeType: string; sizeBytes: number }
): Promise<{ url: string; storagePath: string }> {
  const storagePath = `${type}s/${slug}/${file.filename}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: storagePath,
      Body: file.buffer,
      ContentType: file.mimeType,
      ContentLength: file.sizeBytes,
    })
  );

  const url = `${MINIO_ENDPOINT}/${BUCKET}/${storagePath}`;
  return { url, storagePath };
}

export async function deleteFile(storagePath: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: storagePath,
    })
  );
}
