import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/index";
import { articles, countries } from "@/lib/db/schema";
import { updateCountry } from "@/lib/queries/taxonomy";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const countryId = parseInt(id, 10);
    if (isNaN(countryId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json();
    await updateCountry(countryId, body);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err?.code === "23505" || err?.message?.includes("unique")) {
      return NextResponse.json({ error: "Slug or ISO code already exists" }, { status: 409 });
    }
    console.error("PUT /api/admin/countries/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const countryId = parseInt(id, 10);
    if (isNaN(countryId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const countResult = await db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(articles)
      .where(eq(articles.countryId, countryId));

    const articleCount = countResult[0]?.total ?? 0;
    if (articleCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete country: ${articleCount} article(s) are assigned to it. Reassign or delete them first.` },
        { status: 422 }
      );
    }

    await db.delete(countries).where(eq(countries.id, countryId));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/countries/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
