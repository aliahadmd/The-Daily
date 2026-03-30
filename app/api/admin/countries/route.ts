import { NextRequest, NextResponse } from "next/server";
import { getCountries, createCountry } from "@/lib/queries/taxonomy";
import { slugify } from "@/lib/slugify";

export async function GET() {
  try {
    const rows = await getCountries();
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/admin/countries", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name || String(body.name).trim() === "") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!body.isoCode || String(body.isoCode).trim() === "") {
      return NextResponse.json({ error: "isoCode is required" }, { status: 400 });
    }

    const slug = body.slug ?? slugify(body.name);
    const result = await createCountry({ name: body.name, slug, isoCode: body.isoCode });
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    if (err?.code === "23505" || err?.message?.includes("unique")) {
      return NextResponse.json({ error: "Slug or ISO code already exists" }, { status: 409 });
    }
    console.error("POST /api/admin/countries", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
