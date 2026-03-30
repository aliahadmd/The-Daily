import { getCategories } from "@/lib/queries/taxonomy";
import CategoriesClient from "./_components/CategoriesClient";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="p-8">
      <div className="mb-6 border-b pb-4" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
          Categories
        </h2>
      </div>
      <CategoriesClient
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description ?? null,
          articleCount: c.articleCount,
        }))}
      />
    </div>
  );
}
