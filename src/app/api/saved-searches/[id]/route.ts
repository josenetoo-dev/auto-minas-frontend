import { NextResponse } from "next/server";
import { BackendError, clientError, privateApi, sameOrigin } from "@/lib/backend";

type Props = { params: Promise<{ id: string }> };
async function target({ params }: Props) {
  const { id } = await params;
  if (!/^[1-9]\d{0,17}$/.test(id)) throw new BackendError(400, "Busca inválida");
  return `/v1/buscas-salvas/${id}`;
}
export async function PUT(request: Request, props: Props) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida" }, { status: 403 });
  try { return NextResponse.json(await privateApi(await target(props), { method: "PUT", body: JSON.stringify(await request.json()) })); }
  catch (error) { return clientError(error); }
}
export async function DELETE(request: Request, props: Props) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida" }, { status: 403 });
  try { await privateApi(await target(props), { method: "DELETE" }); return new Response(null, { status: 204 }); }
  catch (error) { return clientError(error); }
}
