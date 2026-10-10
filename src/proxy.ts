import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/backend";
const PROTECTED = ["/vender","/meus-anuncios","/chat","/conta","/verificacoes","/moderacao"];
export function proxy(request:NextRequest) {
 const path=request.nextUrl.pathname;
 if(!PROTECTED.some(p=>path===p||path.startsWith(p+"/")))return NextResponse.next();
 if(!request.cookies.get(SESSION_COOKIE)?.value){
  const url=new URL("/login",request.url);
  url.searchParams.set("next",path);
  return NextResponse.redirect(url);
 }
 return NextResponse.next();
}
export const config={matcher:["/vender/:path*","/meus-anuncios/:path*","/chat/:path*","/conta/:path*","/verificacoes/:path*","/moderacao/:path*"]};
