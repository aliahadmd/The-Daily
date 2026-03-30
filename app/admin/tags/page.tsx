import { getTags } from "@/lib/queries/taxonomy";
import TagsClient from "./_components/TagsClient";

export default async function TagsPage() {
  const tags = await getTags();

  return (
    <div className="p-8">
      <div className="mb-6 border-b pb-4" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
          Tags
        </h2>
      </div>
      <TagsClient
        tags={tags.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          articleCount: t.articleCount,
        }))}
      />
    </div>
  );
}
