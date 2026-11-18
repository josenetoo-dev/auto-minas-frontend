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
  const type=upstream.headers.get("Content-Type");
  const cacheControl = token
    ? "private, max-age=300, stale-while-revalidate=60"
    : "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";
  const headers=new Headers({
    "Content-Type":type?.startsWith("image/")?type:"application/octet-stream",
    "Cache-Control":cacheControl,
    "X-Content-Type-Options":"nosniff"
  });
  const contentLength=upstream.headers.get("Content-Length");
  const etag=upstream.headers.get("ETag");
  const lastModified=upstream.headers.get("Last-Modified");
  if(contentLength)headers.set("Content-Length",contentLength);
  if(etag)headers.set("ETag",etag);
  if(lastModified)headers.set("Last-Modified",lastModified);
  return new Response(upstream.body,{headers});
 }catch {return new Response(null,{status:503});}
}
