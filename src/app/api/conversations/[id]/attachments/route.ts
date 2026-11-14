import { NextResponse } from "next/server";
import { clientError, privateApi, privateApiBinary, sameOrigin } from "@/lib/backend";
type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida" }, { status: 403 });
  const { id } = await context.params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Negociação inválida" }, { status: 400 });
  try {
    const incoming = await request.formData(); const file = incoming.get("file");
    if (!(file instanceof File) || file.size < 1 || file.size > 4 * 1024 * 1024 || !["image/jpeg", "image/png"].includes(file.type)) return NextResponse.json({ error: "Envie uma imagem JPEG ou PNG de até 4 MiB." }, { status: 400 });
    const form = new FormData(); form.set("arquivo", file, file.name);
    const message = await privateApi<{ id: number; remetenteId: number; conteudo: string; criadoEm: string; arquivoNome?: string; tipoMidia?: string; arquivoTamanho?: number }>(`/v1/proposta/${id}/mensagens/anexos`, { method: "POST", body: form });
    return NextResponse.json({ ok: true, message: { id: message.id, senderId: message.remetenteId, content: message.conteudo, createdAt: message.criadoEm, readAt: null, attachment: { name: message.arquivoNome ?? file.name, mime: message.tipoMidia ?? file.type, size: message.arquivoTamanho ?? file.size, url: `/api/conversations/${id}/attachments?messageId=${message.id}` } } });
  } catch (error) { return clientError(error); }
}

export async function GET(request: Request, context: Context) {
  const { id } = await context.params; const messageId = new URL(request.url).searchParams.get("messageId");
  if (!/^\d+$/.test(id) || !messageId || !/^\d+$/.test(messageId)) return NextResponse.json({ error: "Anexo inválido" }, { status: 400 });
  try {
    const upstream = await privateApiBinary(`/v1/proposta/${id}/mensagens/${messageId}/arquivo`);
    return new Response(await upstream.arrayBuffer(), { headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream", "Content-Disposition": "attachment; filename=imagem", "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return clientError(error); }
}
