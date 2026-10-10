import { NextResponse } from "next/server";
import { BackendError, getApiToken, sameOrigin, clientError, API_URL } from "@/lib/backend";

/** BFF same-origin with a narrow allow-list. Spring remains authorization authority. */
// Each controller enforces permissions again with Spring Security. Never forward
// arbitrary paths or external URLs; only known Auto Minas API namespaces.
const allowed = /^v1\/(?:usuario|verificacoes|moderacao|denuncias|proposta)(?:\/[A-Za-z0-9_-]+)*$/;

const PUBLIC_POST = /^auth\/password-reset\/(?:request|confirm)$/;

type Context={params:Promise<{path:string[]}>};
async function forward(request:Request,ctx:Context) {
 const {path}=await ctx.params;
 const relative=path.join("/");
 const method=request.method;
 if(!allowed.test(relative)&&!PUBLIC_POST.test(relative))return NextResponse.json({error:"Rota não disponível."},{status:404});
 if(!["GET","POST","DELETE","PUT"].includes(method))return NextResponse.json({error:"Método inválido."},{status:405});
 if(method!=="GET"&&!sameOrigin(request))return NextResponse.json({error:"Origem não permitida."},{status:403});
 const token=await getApiToken();
 if(!token&&!PUBLIC_POST.test(relative))return NextResponse.json({error:"Faça login."},{status:401});
 try {
  const url=new URL(request.url);
  const query=url.searchParams.toString();
  const pathApi=`/${relative}${query?`?${query}`:""}`;
  const headers=new Headers();
  if(token)headers.set("Authorization",`Bearer ${token}`);
  const contentType=request.headers.get("content-type");
  if(contentType)headers.set("Content-Type",contentType);
  const upstream=await fetch(API_URL+pathApi,{
   method,headers,body:method!=="GET"?await request.arrayBuffer():undefined,
   cache:"no-store",signal:AbortSignal.timeout(15000),
  });
  const bytes=await upstream.arrayBuffer();
  const replyHeaders=new Headers({"Cache-Control":"no-store"});
  if(upstream.headers.get("content-type"))replyHeaders.set("Content-Type",upstream.headers.get("content-type")!);
  return new Response(bytes.length?bytes:null,{status:upstream.status,headers:replyHeaders});
 }catch {return clientError(new BackendError(503,"API indisponível."));}
}
export const GET=forward;
export const POST=forward;
export const PUT=forward;
export const DELETE=forward;
