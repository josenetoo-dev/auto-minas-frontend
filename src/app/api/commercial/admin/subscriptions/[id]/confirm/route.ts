import { NextResponse } from "next/server";
import { clientError, privateApi, sameOrigin } from "@/lib/backend";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida" }, { status: 403 });
  const { id } = await context.params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  try {
    const body = await request.json() as { referenciaExterna?: unknown };
    if (typeof body.referenciaExterna !== "string" || body.referenciaExterna.length > 160) return NextResponse.json({ error: "Referência inválida" }, { status: 400 });
    return NextResponse.json(await privateApi(`/v1/assinaturas/${id}/confirmar-pagamento-externo`, { method: "POST", body: JSON.stringify(body) }));
  } catch (error) { return clientError(error); }
}
