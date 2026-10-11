import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendFetch, SESSION_COOKIE } from "@/lib/backend";

export type SessionPayload = {
  id: number;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: "USER" | "REVIEWER" | "ADMIN";
  status: "ACTIVE" | "PENDING_CONTACT_VERIFICATION" | "SUSPENDED" | "BLOCKED" | "DELETED";
};

export async function createSession(accessToken: string) {
  // Never trust client identity; get account details from Spring with issued JWT.
  const me = await backendFetch<{id:number;email:string;nome:string;role:SessionPayload["role"];status:SessionPayload["status"]}>("/v1/usuario/me", {}, accessToken);
  if (!me.id) throw new Error("A API não retornou uma identidade válida.");
  (await cookies()).set(SESSION_COOKIE, accessToken, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 30,
  });
  return toSession(me);
}

function toSession(me: {id:number;email:string;nome:string;role:SessionPayload["role"];status:SessionPayload["status"]}):SessionPayload {
  return {id:me.id,email:me.email,name:me.nome,avatarUrl:null,role:me.role,status:me.status};
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try { return toSession(await backendFetch<{id:number;email:string;nome:string;role:SessionPayload["role"];status:SessionPayload["status"]}>("/v1/usuario/me",{},token)); }
  catch { return null; } // JWT revocation and account deletion enforced by Spring
}

export async function destroySession() { (await cookies()).delete(SESSION_COOKIE); }
export async function requireUser():Promise<SessionPayload> {
  const user = await getSession();
  if (!user) redirect("/login?error=expired");
  return user;
}
