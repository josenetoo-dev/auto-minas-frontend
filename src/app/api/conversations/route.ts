import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { backendFetch, clientError, getApiToken, sameOrigin } from "@/lib/backend";
import { getConversationSummaries, type BackendProposal } from "@/lib/chat";
import { carById } from "@/lib/car";
export async function GET(){try{
 const u=await getSession();if(!u)return NextResponse.json({error:"Faça login"},{status:401});
 return NextResponse.json({conversations:await getConversationSummaries(u.id)});
}catch(e){return clientError(e);}}
export async function POST(request:Request){
 if(!sameOrigin(request))return NextResponse.json({error:"Origem não permitida"},{status:403});
 try{
  const u=await getSession(),token=await getApiToken();
  if(!u||!token)return NextResponse.json({error:"Faça login"},{status:401});
  const data=await request.json() as {carId?:number;price?:number;message?:string};
  if(!Number.isSafeInteger(data.carId)||!data.carId||!Number.isFinite(data.price)||!data.price||data.price<=0||!data.message?.trim())
   return NextResponse.json({error:"Informe anúncio, valor e mensagem da proposta."},{status:400});
  const car=await carById(data.carId,token);
  if(car.userId===u.id)return NextResponse.json({error:"Você é o vendedor deste anúncio"},{status:403});
  if(car.status!=="ativo")return NextResponse.json({error:"Anúncio não está publicado"},{status:409});
  const p=await backendFetch<BackendProposal>("/v1/proposta",{method:"POST",body:JSON.stringify({anuncioId:data.carId,valor:data.price,descricao:data.message.trim()})},token);
  return NextResponse.json({ok:true,id:p.id},{status:201});
 }catch(e){return clientError(e);}
}
