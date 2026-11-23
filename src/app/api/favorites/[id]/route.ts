import { NextResponse } from "next/server";
import { clientError, privateApi, sameOrigin } from "@/lib/backend";

type Props = { params: Promise<{ id: string }> };
async function target({ params }: Props) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) throw new Error("Anúncio inválido");
  return `/v1/favoritos/${id}`;
}
export async function PUT(request: Request, props: Props) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida" }, { status: 403 });
  try { await privateApi(await target(props), { method: "PUT" }); return new Response(null, { status: 204 }); }
  catch (error) { return clientError(error); }
}
export async function DELETE(request: Request, props: Props) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida" }, { status: 403 });
  try { await privateApi(await target(props), { method: "DELETE" }); return new Response(null, { status: 204 }); }
  catch (error) { return clientError(error); }
}
