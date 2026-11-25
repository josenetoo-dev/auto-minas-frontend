import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { backendFetch, clientError, getApiToken, sameOrigin, SESSION_REFRESH_COOKIE } from "@/lib/backend";
import { cookies } from "next/headers";

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
    if (!body.token || !/^[0-9]{6}$/.test(body.token)) {
      return NextResponse.json({ error: "Informe os 6 dígitos do código." }, { status: 400 });
    }

    const result = await backendFetch<{ token: string }>(
      "/v1/usuario/me/contato/email/confirmar",
      { method: "POST", body: JSON.stringify(body) },
      currentToken,
    );
    const previousRefresh = (await cookies()).get(SESSION_REFRESH_COOKIE)?.value;
    const renewed = previousRefresh ? await backendFetch<{ token:string; refreshToken:string }>(
      "/auth/session/renew", {method:"POST",body:JSON.stringify({refreshToken:previousRefresh})}, result.token,
    ) : null;
    const session = await createSession(renewed?.token ?? result.token,renewed?.refreshToken);
    const redirect = session.role === "ADMIN" || session.role === "REVIEWER"
      ? "/moderacao"
      : "/conta";
    return NextResponse.json({ ok: true, redirect });
  } catch (error) {
    return clientError(error);
  }
}
