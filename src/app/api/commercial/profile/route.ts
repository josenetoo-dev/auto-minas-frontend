import { NextResponse } from "next/server";
import { clientError, privateApi, sameOrigin } from "@/lib/backend";

export async function GET() {
  try { return NextResponse.json(await privateApi("/v1/usuario/me/dados-vendedor")); }
  catch (error) { return clientError(error); }
}

export async function PUT(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida" }, { status: 403 });
  try {
    const body = await request.json() as { nomeCompleto?: unknown; cpf?: unknown };
    if (typeof body.nomeCompleto !== "string" || typeof body.cpf !== "string" || body.nomeCompleto.length > 160 || body.cpf.length > 14) {
      return NextResponse.json({ error: "Informe nome completo e CPF válidos." }, { status: 400 });
    }
    return NextResponse.json(await privateApi("/v1/usuario/me/dados-vendedor", { method: "PUT", body: JSON.stringify(body) }));
  } catch (error) { return clientError(error); }
}
