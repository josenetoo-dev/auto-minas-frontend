import {API_URL} from "@/lib/backend";

export async function GET(_:Request, {params}:{params:Promise<{id:string}>}) {
 const {id}=await params;
 if(!/^\d+$/.test(id))return new Response(null,{status:404});
 const upstream=await fetch(`${API_URL}/v1/perfis/${id}/foto`,{cache:"no-store",signal:AbortSignal.timeout(12000)});
 if(!upstream.ok)return new Response(null,{status:upstream.status});
 const type=upstream.headers.get("content-type")||"";
 if(!["image/jpeg","image/png"].includes(type))return new Response(null,{status:502});
 return new Response(upstream.body,{headers:{"Content-Type":type,"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
}
