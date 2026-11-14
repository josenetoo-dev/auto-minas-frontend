import { NextResponse } from "next/server";
import { clientError, privateApi, sameOrigin } from "@/lib/backend";
export async function GET() {
  try { return NextResponse.json(await privateApi("/v1/contratos/admin/versoes?page=0&size=100")); }
  catch (error) { return clientError(error); }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida" }, { status: 403 });
  try {
    const body = await request.json() as { versao?: unknown; titulo?: unknown; conteudo?: unknown };
    if (typeof body.versao !== "string" || typeof body.titulo !== "string" || typeof body.conteudo !== "string" || body.conteudo.length > 100_000) return NextResponse.json({ error: "Informe versão, título e conteúdo válidos." }, { status: 400 });
    return NextResponse.json(await privateApi("/v1/contratos/admin/versoes", { method: "POST", body: JSON.stringify(body) }), { status: 201 });
  } catch (error) { return clientError(error); }
}
