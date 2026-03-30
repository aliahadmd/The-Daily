import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db/index";
import { videoPosts } from "@/lib/db/schema";
import { createVideoPost } from "@/lib/queries/videos";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(videoPosts)
      .orderBy(desc(videoPosts.createdAt));

    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/admin/videos", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.title || !body.slug) {
      return NextResponse.json({ error: "title and slug are required" }, { status: 400 });
    }

    const result = await createVideoPost(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    if (err?.code === "23505" || err?.message?.includes("unique")) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    console.error("POST /api/admin/videos", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
