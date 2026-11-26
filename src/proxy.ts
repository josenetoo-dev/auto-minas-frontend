import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, SESSION_REFRESH_COOKIE } from "@/lib/backend";
const PROTECTED = ["/vender","/meus-anuncios","/chat","/conta","/verificacoes","/moderacao"];
const SKIP_REFRESH = ["/api/auth/login","/api/auth/signup","/api/auth/logout"];
const ACCESS_AGE = 30 * 60;
function expiresSoon(token:string) {
 try {
  const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));
  return typeof payload.exp !== "number" || payload.exp <= Date.now()/1000 + 60;
 } catch { return true; }
}
export async function proxy(request:NextRequest) {
 const path=request.nextUrl.pathname;
 const protectedPath=path!=="/vender/planos" && PROTECTED.some(p=>path===p||path.startsWith(p+"/"));
 const access=request.cookies.get(SESSION_COOKIE)?.value;
 const refresh=request.cookies.get(SESSION_REFRESH_COOKIE)?.value;
 if(refresh && (!access || expiresSoon(access)) && !SKIP_REFRESH.includes(path)) {
  try {
   const api=(process.env.AUTO_MINAS_API_URL || "http://localhost:8080").replace(/\/$/,"");
   const response=await fetch(`${api}/auth/refresh`,{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({refreshToken:refresh}),
    cache:"no-store",signal:AbortSignal.timeout(5000),
   });
   if(response.ok) {
    const result=await response.json() as {token?:string};
    if(result.token) {
     request.cookies.set(SESSION_COOKIE,result.token);
     const next=NextResponse.next({request:{headers:request.headers}});
     next.cookies.set(SESSION_COOKIE,result.token,{
      httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:ACCESS_AGE,
     });
     return next;
    }
   }
   if(response.status===401 || response.status===403) {
    const expired=protectedPath ? NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(path+request.nextUrl.search)}`,request.url)) : NextResponse.next();
    expired.cookies.delete(SESSION_COOKIE);
    expired.cookies.delete(SESSION_REFRESH_COOKIE);
    return expired;
   }
  } catch { /* indisponibilidade temporária: manter a sessão para tentar na próxima requisição */ }
 }
 if(!protectedPath)return NextResponse.next();
 if(!request.cookies.get(SESSION_COOKIE)?.value){
  const url=new URL("/login",request.url);
  url.searchParams.set("next",path + request.nextUrl.search);
  return NextResponse.redirect(url);
 }
 return NextResponse.next();
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|images/).*)"]};
