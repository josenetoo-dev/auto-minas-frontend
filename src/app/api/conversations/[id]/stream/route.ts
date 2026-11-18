import { API_URL, BackendError, clientError, getApiToken } from "@/lib/backend";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Context = {params:Promise<{id:string}>};

/** Repassa somente eventos do canal autenticado. Nunca expõe token JWT ao browser. */
export async function GET(request:Request,{params}:Context){
  const {id}=await params;
  if(!/^\d+$/.test(id)) return Response.json({error:"Conversa inválida"},{status:400});
  const token=await getApiToken();
  if(!token) return Response.json({error:"Faça login"},{status:401});

  try{
    const upstream=await fetch(`${API_URL}/v1/proposta/${id}/mensagens/stream`,{
      headers:{Authorization:`Bearer ${token}`,Accept:"text/event-stream"},
      cache:"no-store",
      signal:request.signal,
    });
    if(!upstream.ok||!upstream.body){
      return Response.json({error:"Não foi possível conectar ao chat em tempo real"},{status:upstream.status||502});
    }
    return new Response(upstream.body,{
      status:200,
      headers:{
        "Content-Type":"text/event-stream; charset=utf-8",
        "Cache-Control":"no-cache, no-transform, private",
        "X-Accel-Buffering":"no",
        "X-Content-Type-Options":"nosniff",
      },
    });
  }catch{
    return clientError(new BackendError(503,"Conexão em tempo real indisponível"));
  }
}
