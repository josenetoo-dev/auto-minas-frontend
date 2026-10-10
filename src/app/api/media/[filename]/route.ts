import { NextResponse } from "next/server";
import { API_URL, getApiToken } from "@/lib/backend";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{filename:string}>}) {
 const {filename}=await params;
 if(!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}\.(?:jpg|png)$/.test(filename))
  return NextResponse.json({error:"Imagem indisponível"},{status:404});
 const token=await getApiToken();
 try{
  const upstream=await fetch(`${API_URL}/uploads/fotos/${filename}`,{
   headers:token?{Authorization:`Bearer ${token}`}:{},cache:"no-store",signal:AbortSignal.timeout(10000),
  });
  if(!upstream.ok)return new Response(null,{status:upstream.status===401?404:upstream.status});
  const bytes=await upstream.arrayBuffer();
  const type=upstream.headers.get("Content-Type");
  return new Response(bytes,{headers:{"Content-Type":type?.startsWith("image/")?type:"application/octet-stream",
     "Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff"}});
 }catch {return new Response(null,{status:503});}
}
