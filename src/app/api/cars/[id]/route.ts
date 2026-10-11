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
  // Apenas ações permitidas ao proprietário, validadas novamente pelo Spring.
  if(Object.keys(body).length===1 && typeof body.status==="string"){
   const transitions:Record<string,string>={pausado:"pausar",pendente:"reativar",vendido:"vendido"};
   const suffix=transitions[body.status.toLowerCase()];
   if(!suffix)return NextResponse.json({error:"Transição de status inválida."},{status:400});
   const updated=await privateApi<BackendAd>(`/v1/anuncio/${id}/${suffix}`,{method:"POST"});
   return NextResponse.json({ok:true,id:updated.id,status:updated.status});
  }
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
