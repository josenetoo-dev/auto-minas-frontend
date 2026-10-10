import { NextResponse } from "next/server";
import { privateApi, clientError, sameOrigin } from "@/lib/backend";
import { apiAdPayload, type BackendAd } from "@/lib/car";
type Ctx={params:Promise<{id:string}>};
function idOf(s:string){return /^\d+$/.test(s)&&Number(s)>0?Number(s):null;}
export async function PATCH(request:Request,context:Ctx){
 if(!sameOrigin(request))return NextResponse.json({error:"Origem não permitida"},{status:403});
 const id=idOf((await context.params).id);
 if(!id)return NextResponse.json({error:"Anúncio inválido"},{status:400});
 try {
  const body=await request.json();
  // The Spring API doesn't expose owner status transitions. Never fabricate success.
  if(Object.keys(body).length===1&&body.status)
   return NextResponse.json({error:"Alteração de status indisponível nesta versão da API."},{status:501});
  const ad=await privateApi<BackendAd>(`/v1/anuncio/${id}`,{method:"PUT",body:JSON.stringify(apiAdPayload(body))});
  return NextResponse.json({ok:true,id:ad.id,status:ad.status});
 }catch(e){return clientError(e);}
}
export async function DELETE(request:Request,context:Ctx){
 if(!sameOrigin(request))return NextResponse.json({error:"Origem não permitida"},{status:403});
 const id=idOf((await context.params).id);
 if(!id)return NextResponse.json({error:"Anúncio inválido"},{status:400});
 try{await privateApi<void>(`/v1/anuncio/${id}`,{method:"DELETE"});return NextResponse.json({ok:true,archived:true});}
 catch(e){return clientError(e);}
}
