import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

export const OAUTH_STATE_COOKIE = "auto_minas_oauth_state";
export const OAUTH_NEXT_COOKIE = "auto_minas_oauth_next";

export function safeOAuthNext(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function beginOAuth(request: Request, provider: "google" | "github") {
  const url = new URL(request.url);
  const state = randomBytes(24).toString("base64url");
  const next = safeOAuthNext(url.searchParams.get("next"));
  const callback = new URL(`/api/auth/${provider}/callback`, url.origin).toString();
  const clientId = provider === "google" ? process.env.GOOGLE_CLIENT_ID : process.env.GITHUB_CLIENT_ID;
  if (!clientId) return Response.redirect(new URL("/login?error=oauth_not_configured", url.origin));

  const authorization = provider === "google"
    ? new URL("https://accounts.google.com/o/oauth2/v2/auth")
    : new URL("https://github.com/login/oauth/authorize");
  authorization.searchParams.set("client_id", clientId);
  authorization.searchParams.set("redirect_uri", callback);
  authorization.searchParams.set("state", state);
  authorization.searchParams.set("scope", provider === "google" ? "openid email profile" : "read:user user:email");
  if (provider === "google") {
    authorization.searchParams.set("response_type", "code");
    authorization.searchParams.set("prompt", "select_account");
  }
  const jar = await cookies();
  const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 };
  jar.set(OAUTH_STATE_COOKIE, state, options);
  jar.set(OAUTH_NEXT_COOKIE, next, options);
  return Response.redirect(authorization);
}

export async function finishOAuth(request: Request, provider: "google" | "github") {
  const url = new URL(request.url);
  const jar = await cookies();
  const expected = jar.get(OAUTH_STATE_COOKIE)?.value;
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const next = safeOAuthNext(jar.get(OAUTH_NEXT_COOKIE)?.value ?? "/");
  jar.delete(OAUTH_STATE_COOKIE);
  jar.delete(OAUTH_NEXT_COOKIE);
  if (!code || !state || !expected || state !== expected) {
    return Response.redirect(new URL("/login?error=oauth_invalid_state", url.origin));
  }
  // O código e o state já chegam validados. A próxima etapa troca o código pelo
  // token do provedor e o entrega à API Spring para criar/vincular a conta.
  const pending = new URL("/login", url.origin);
  pending.searchParams.set("error", "oauth_backend_pending");
  pending.searchParams.set("provider", provider);
  pending.searchParams.set("next", next);
  return Response.redirect(pending);
}
