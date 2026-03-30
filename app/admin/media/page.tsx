import { listMedia } from "@/lib/queries/media";
import DeleteMediaButton from "./_components/DeleteMediaButton";
import Image from "next/image";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function MediaPage() {
  const mediaItems = await listMedia();

  return (
    <div className="p-8">
      <div className="mb-6 border-b pb-4" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
          Media Library
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          {mediaItems.length} file{mediaItems.length !== 1 ? "s" : ""}
        </p>
      </div>

      {mediaItems.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>No media files uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {mediaItems.map((item) => {
            const isImage = item.mimeType.startsWith("image/");
            return (
              <div
                key={item.id}
                className="border flex flex-col"
                style={{ borderColor: "var(--border)", background: "var(--cream-dark)" }}
              >
                {/* Thumbnail */}
                <div
                  className="relative w-full h-32 flex items-center justify-center border-b overflow-hidden"
                  style={{ borderColor: "var(--border)" }}
                >
                  {isImage ? (
                    <Image
                      src={item.url}
                      alt={item.filename}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-3xl">🎬</span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 flex-1 flex flex-col gap-1">
                  <p
                    className="text-xs font-bold truncate"
                    style={{ color: "var(--ink)" }}
                    title={item.filename}
                  >
                    {item.filename}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {item.mimeType}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {formatBytes(item.sizeBytes)}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {new Date(item.uploadedAt).toLocaleDateString()}
                  </p>
                  <div className="mt-2">
                    <DeleteMediaButton id={item.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
