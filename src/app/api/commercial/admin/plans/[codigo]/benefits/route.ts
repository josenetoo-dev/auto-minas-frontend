import { NextResponse } from "next/server";
import { clientError, privateApi, sameOrigin } from "@/lib/backend";
export async function PUT(request: Request, context: { params: Promise<{ codigo: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida" }, { status: 403 });
  const { codigo } = await context.params;
  if (!/^(BASIC|PROFESSIONAL|PREMIUM)$/.test(codigo)) return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
  try {
    const body = await request.json() as { beneficios?: unknown };
    if (!Array.isArray(body.beneficios) || body.beneficios.some(item => typeof item !== "string") || body.beneficios.length > 20) return NextResponse.json({ error: "Informe uma lista válida de benefícios." }, { status: 400 });
    return NextResponse.json(await privateApi(`/v1/planos/${codigo}/beneficios`, { method: "PUT", body: JSON.stringify(body) }));
  } catch (error) { return clientError(error); }
}
