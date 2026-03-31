import { NextRequest, NextResponse } from "next/server";
import { destroyUserSession } from "@/lib/user-auth";

export async function POST(request: NextRequest) {
  await destroyUserSession();
  return NextResponse.redirect(new URL("/", request.url));
}
