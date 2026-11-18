import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  const response = NextResponse.json({
    user: session ? { name: session.name, avatarUrl: session.avatarUrl, role: session.role } : null,
  });
  response.headers.set("Cache-Control", "no-store, private");
  return response;
}
