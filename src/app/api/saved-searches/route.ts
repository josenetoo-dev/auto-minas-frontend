import { NextResponse } from "next/server";
import { clientError, privateApi, sameOrigin } from "@/lib/backend";

export async function GET() {
  try { return NextResponse.json(await privateApi("/v1/buscas-salvas")); }
  catch (error) { return clientError(error); }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida" }, { status: 403 });
  try { return NextResponse.json(await privateApi("/v1/buscas-salvas", { method: "POST", body: JSON.stringify(await request.json()) }), { status: 201 }); }
  catch (error) { return clientError(error); }
}
