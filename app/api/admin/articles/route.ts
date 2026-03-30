import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db/index";
import { articles, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createArticle } from "@/lib/queries/articles";
import { validateArticleInput } from "@/lib/validation";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        status: articles.status,
        isBreakingNews: articles.isBreakingNews,
        isFeatured: articles.isFeatured,
        authorName: articles.authorName,
        categoryId: articles.categoryId,
        categoryName: categories.name,
        countryId: articles.countryId,
        coverImageId: articles.coverImageId,
        publishedAt: articles.publishedAt,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
      })
      .from(articles)
      .innerJoin(categories, eq(articles.categoryId, categories.id))
      .orderBy(desc(articles.createdAt));

    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/admin/articles", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateArticleInput(body);

    if (!validation.valid) {
      return NextResponse.json({ error: "Validation failed", details: validation.errors }, { status: 400 });
    }

    const result = await createArticle(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    // Unique constraint violation on slug
    if (err?.code === "23505" || err?.message?.includes("unique")) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    console.error("POST /api/admin/articles", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
