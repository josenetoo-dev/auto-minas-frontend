import { NextResponse } from "next/server";
import type { CommercialContract } from "@/lib/commercial";
import { clientError, privateApi, sameOrigin, type SpringPage } from "@/lib/backend";
export async function GET() {
  try {
    const { content } = await privateApi<SpringPage<CommercialContract>>("/v1/contratos/admin/versoes?page=0&size=100");
    return NextResponse.json({
      content: content.filter(({ versao }) => versao !== "1.0-DEMO")
        .map(({ id, versao, titulo, publicado }) => ({ id, versao, titulo, publicado })),
    });
  }
  catch (error) { return clientError(error); }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida" }, { status: 403 });
  try {
    const body = await request.json() as { versao?: unknown; titulo?: unknown; conteudo?: unknown };
    if (typeof body.versao !== "string" || typeof body.titulo !== "string" || typeof body.conteudo !== "string" || body.conteudo.length > 100_000) return NextResponse.json({ error: "Informe versão, título e conteúdo válidos." }, { status: 400 });
    const { id } = await privateApi<CommercialContract>("/v1/contratos/admin/versoes", { method: "POST", body: JSON.stringify(body) });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) { return clientError(error); }
}
