import { NextRequest, NextResponse } from "next/server";
import { getTags, createTag } from "@/lib/queries/taxonomy";
import { slugify } from "@/lib/slugify";

export async function GET() {
  try {
    const rows = await getTags();
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/admin/tags", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name || String(body.name).trim() === "") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const slug = body.slug ?? slugify(body.name);
    const result = await createTag({ name: body.name, slug });
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    if (err?.code === "23505" || err?.message?.includes("unique")) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    console.error("POST /api/admin/tags", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
