import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import { media } from "../db/schema";

export type MediaRecord = {
  id: number;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  storagePath: string;
  uploadedAt: Date;
};

export async function createMediaRecord(data: {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  storagePath: string;
}): Promise<{ id: number }> {
  const [inserted] = await db
    .insert(media)
    .values(data)
    .returning({ id: media.id });

  return { id: inserted.id };
}

export async function deleteMediaRecord(id: number): Promise<{ storagePath: string } | null> {
  const rows = await db
    .select({ storagePath: media.storagePath })
    .from(media)
    .where(eq(media.id, id));

  if (rows.length === 0) return null;

  const { storagePath } = rows[0];
  await db.delete(media).where(eq(media.id, id));

  return { storagePath };
}

export async function listMedia(): Promise<MediaRecord[]> {
  return db
    .select()
    .from(media)
    .orderBy(desc(media.uploadedAt));
}
