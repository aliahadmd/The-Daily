import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateUserStatus } from "@/lib/queries/users";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  try {
    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const { status } = await req.json();
    if (status !== "active" && status !== "banned") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await updateUserStatus(userId, status);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/admin/users/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
