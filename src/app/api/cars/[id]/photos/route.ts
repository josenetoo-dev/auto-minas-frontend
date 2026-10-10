import { NextResponse } from "next/server";
import { backendFetch, getApiToken, clientError, sameOrigin } from "@/lib/backend";
import type { BackendPhoto } from "@/lib/car";
type Ctx={params:Promise<{id:string}>};
export async function POST(request:Request,context:Ctx){
 if(!sameOrigin(request))return NextResponse.json({error:"Origem não permitida"},{status:403});
 const {id}=await context.params;
 if(!/^\d+$/.test(id))return NextResponse.json({error:"Anúncio inválido"},{status:400});
 try {
  const token=await getApiToken();if(!token)return NextResponse.json({error:"Entre na conta"},{status:401});
  const body=await request.formData();const files=body.getAll("fotos");
  if(!files.length||files.length>10||files.some(x=>!(x instanceof File)||x.size<=0||x.size>5*1024*1024||!["image/jpeg","image/png"].includes(x.type)))
   return NextResponse.json({error:"Envie até 10 fotos por lote, JPG/PNG, com até 5 MB cada."},{status:400});
  const multipart=new FormData();for(const file of files)multipart.append("fotos",file);
  const result=await backendFetch<BackendPhoto[]>(`/v1/anuncio/${id}/fotos`,{method:"POST",body:multipart},token);
  return NextResponse.json({photos:result},{status:201});
 }catch(e){return clientError(e);}
}
export async function DELETE(request:Request,context:Ctx){
 if(!sameOrigin(request))return NextResponse.json({error:"Origem não permitida"},{status:403});
 const {id}=await context.params;
 const fotoId=new URL(request.url).searchParams.get("fotoId");
 if(!/^\d+$/.test(id)||!fotoId||!/^\d+$/.test(fotoId))return NextResponse.json({error:"Foto inválida"},{status:400});
 try{
  const token=await getApiToken();if(!token)return NextResponse.json({error:"Entre na conta"},{status:401});
  await backendFetch<void>(`/v1/anuncio/${id}/fotos/${fotoId}`,{method:"DELETE"},token);
  return NextResponse.json({ok:true});
 }catch(e){return clientError(e);}
}
