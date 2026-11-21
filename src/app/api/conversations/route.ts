import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { backendFetch, clientError, getApiToken, sameOrigin } from "@/lib/backend";
import { getConversationSummaries, type BackendProposal } from "@/lib/chat";
export async function GET(){try{
 const u=await getSession();if(!u)return NextResponse.json({error:"Faça login"},{status:401});
 return NextResponse.json({conversations:await getConversationSummaries(u.id)});
}catch(e){return clientError(e);}}
export async function POST(request:Request){
 if(!sameOrigin(request))return NextResponse.json({error:"Origem não permitida"},{status:403});
 try{
  const u=await getSession(),token=await getApiToken();
  if(!u||!token)return NextResponse.json({error:"Faça login"},{status:401});
  const { carId, price, message, requestId } = await request.json();
  if (!Number.isSafeInteger(carId) || carId <= 0 || !Number.isFinite(price) || price <= 0
      || typeof message !== "string" || !message.trim() || message.trim().length > 255
      || (requestId !== undefined && (typeof requestId !== "string"
          || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(requestId)))) {
    return NextResponse.json({error:"Informe anúncio, valor e mensagem da proposta."},{status:400});
  }
  const p = await backendFetch<BackendProposal>("/v1/proposta", {
    method: "POST",
    body: JSON.stringify({ anuncioId: carId, valor: price, descricao: message.trim(), envioId: requestId }),
  }, token);
  return NextResponse.json({ok:true,id:p.id},{status:201});
 }catch(e){return clientError(e);}
}
