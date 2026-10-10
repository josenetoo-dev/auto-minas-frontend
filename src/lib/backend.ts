/** Única origem dos dados: API Java/Spring Boot Auto Minas. */
import { cookies } from "next/headers";

export const API_URL = (process.env.AUTO_MINAS_API_URL || "http://localhost:8080").replace(/\/$/, "");
export const SESSION_COOKIE = "auto_minas_access";
export class BackendError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = "BackendError"; }
}

export function apiMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const data = body as Record<string, unknown>;
  const message = data.detail ?? data.message ?? data.error ?? data.title;
  return typeof message === "string" && message.length <= 600 ? message : fallback;
}

export async function backendFetch<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  // Path is constructed only by server-side code, never use a caller-supplied absolute URL.
  if (!path.startsWith("/") || path.startsWith("//")) throw new BackendError(400, "Caminho inválido");
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (options.body && !(options.body instanceof FormData) && typeof options.body === "string") {
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  }
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options, headers, cache: "no-store", signal: options.signal ?? AbortSignal.timeout(12000),
    });
  } catch {
    throw new BackendError(503, "A API Auto Minas está indisponível no momento.");
  }
  if (!response.ok) {
    const value = await response.json().catch(() => null);
    throw new BackendError(response.status, apiMessage(value, `Erro na API (${response.status})`));
  }
  if (response.status === 204) return undefined as T;
  const type = response.headers.get("content-type") || "";
  if (!type.includes("json")) throw new BackendError(502, "Resposta inesperada da API.");
  return response.json() as Promise<T>;
}

export async function getApiToken() { return (await cookies()).get(SESSION_COOKIE)?.value ?? null; }
export async function privateApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getApiToken();
  if (!token) throw new BackendError(401, "Faça login para continuar.");
  return backendFetch<T>(path, options, token);
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if (site === "cross-site") return false;
  if (!origin) return true; // non-browser/mobile clients need server auth too
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}

export function clientError(error: unknown) {
  const status = error instanceof BackendError ? error.status : 500;
  const message = error instanceof Error ? error.message : "Não foi possível concluir a operação.";
  return Response.json({ error: message }, { status });
}

export type SpringPage<T> = { content: T[]; totalElements: number; totalPages: number; number: number };
export async function allPages<T>(path: string, token?: string, maxPages = 10): Promise<T[]> {
  const results: T[] = [];
  for (let page = 0; page < maxPages; page++) {
    const separator = path.includes("?") ? "&" : "?";
    const response = await backendFetch<SpringPage<T>>(`${path}${separator}page=${page}&size=100`, {}, token);
    results.push(...response.content);
    if (page + 1 >= response.totalPages || response.content.length === 0) break;
  }
  return results;
}
