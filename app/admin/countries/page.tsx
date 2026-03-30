import { getCountries } from "@/lib/queries/taxonomy";
import CountriesClient from "./_components/CountriesClient";

export default async function CountriesPage() {
  const countries = await getCountries();

  return (
    <div className="p-8">
      <div className="mb-6 border-b pb-4" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
          Countries
        </h2>
      </div>
      <CountriesClient
        countries={countries.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          isoCode: c.isoCode,
          articleCount: c.articleCount,
        }))}
      />
    </div>
  );
}
