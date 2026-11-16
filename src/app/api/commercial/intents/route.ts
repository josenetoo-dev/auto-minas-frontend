import { NextResponse } from "next/server";
import { privateApi, clientError, sameOrigin } from "@/lib/backend";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida" }, { status: 403 });
  try {
    const body = await request.json();
    if (!["AVULSO", "RECORRENTE"].includes(body.codigoPlano)) return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    const result = await privateApi("/v1/assinaturas/intencoes", { method: "POST", body: JSON.stringify({ codigoPlano: body.codigoPlano }) });
    return NextResponse.json(result, { status: 201 });
  } catch (error) { return clientError(error); }
}
