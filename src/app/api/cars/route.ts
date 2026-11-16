import { NextResponse } from "next/server";
import { privateApi, clientError, sameOrigin, getApiToken, allPages, BackendError } from "@/lib/backend";
import { apiAdPayload, type BackendAd } from "@/lib/car";
export async function POST(request:Request) {
 if(!sameOrigin(request))return NextResponse.json({error:"Origem não permitida"},{status:403});
 try {
  const payload=apiAdPayload(await request.json());
  const ad=await privateApi<BackendAd>("/v1/anuncio",{method:"POST",body:JSON.stringify(payload)});
  return NextResponse.json({ok:true,id:ad.id,status:ad.status}, {status:201});
 }catch(e){return clientError(e);}
}


export async function GET() {
 try {
  const token=await getApiToken();
  if(!token) throw new BackendError(401,"Entre na sua conta para ver seus veículos.");
  return NextResponse.json({content:await allPages<BackendAd>("/v1/anuncio/meus",token)});
 }catch(error){return clientError(error);}
}
