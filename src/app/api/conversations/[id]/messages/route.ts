import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { backendFetch, clientError, sameOrigin, getApiToken } from "@/lib/backend";
import { getChatThread, type BackendMessage } from "@/lib/chat";
type C={params:Promise<{id:string}>};
export async function GET(_request:Request,ctx:C){
 const user=await getSession();if(!user)return NextResponse.json({error:"Faça login"},{status:401});
 const id=(await ctx.params).id;if(!/^\d+$/.test(id))return NextResponse.json({error:"Proposta inválida"},{status:400});
 try{const thread=await getChatThread(user.id,Number(id));
  return thread?NextResponse.json(thread):NextResponse.json({error:"Negociação não encontrada"},{status:404});
 }catch(e){return clientError(e);}
}
export async function POST(request:Request,ctx:C){
 if(!sameOrigin(request))return NextResponse.json({error:"Origem não permitida"},{status:403});
 const id=(await ctx.params).id;if(!/^\d+$/.test(id))return NextResponse.json({error:"Proposta inválida"},{status:400});
 try{
  const token=await getApiToken();if(!token)return NextResponse.json({error:"Faça login"},{status:401});
  const body=await request.json() as {content?:string};const message=body.content?.trim();
  if(!message||message.length>2000)return NextResponse.json({error:"Mensagem inválida"},{status:400});
  const data=await backendFetch<BackendMessage>(`/v1/proposta/${id}/mensagens`,{method:"POST",body:JSON.stringify({conteudo:message})},token);
  return NextResponse.json({ok:true,message:{id:data.id,senderId:data.remetenteId,content:data.conteudo,createdAt:data.criadoEm,readAt:null}});
 }catch(e){return clientError(e);}
}
