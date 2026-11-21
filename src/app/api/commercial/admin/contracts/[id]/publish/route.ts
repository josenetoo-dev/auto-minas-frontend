import { NextResponse } from "next/server";
import type { CommercialContract } from "@/lib/commercial";
import { clientError, privateApi, sameOrigin } from "@/lib/backend";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida" }, { status: 403 });
  const { id } = await context.params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Versão inválida" }, { status: 400 });
  try {
    const contract = await privateApi<CommercialContract>(`/v1/contratos/admin/versoes/${id}/publicar`, { method: "POST" });
    return NextResponse.json({ id: contract.id });
  }
  catch (error) { return clientError(error); }
}
