import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listUsers, searchUsers } from "@/lib/queries/users";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = 20;

  try {
    const result =
      search && search.trim().length > 0
        ? await searchUsers(search.trim(), page, pageSize)
        : await listUsers(page, pageSize);

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/admin/users", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
