import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { backendFetch, clientError, getApiToken, sameOrigin } from "@/lib/backend";

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Origem não permitida" }, { status: 403 });
  }

  const currentToken = await getApiToken();
  if (!currentToken) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  try {
    const body = await request.json() as { token?: string };
    if (!body.token?.trim()) {
      return NextResponse.json({ error: "Informe o código de confirmação." }, { status: 400 });
    }

    const result = await backendFetch<{ token: string }>(
      "/v1/usuario/me/contato/email/confirmar",
      { method: "POST", body: JSON.stringify(body) },
      currentToken,
    );
    const session = await createSession(result.token);
    const redirect = session.role === "ADMIN" || session.role === "REVIEWER"
      ? "/moderacao"
      : "/conta";
    return NextResponse.json({ ok: true, redirect });
  } catch (error) {
    return clientError(error);
  }
}
