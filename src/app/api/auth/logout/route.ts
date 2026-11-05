import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { backendFetch, clientError, getApiToken, sameOrigin } from "@/lib/backend";
export async function POST(request:Request){
 if(!sameOrigin(request))return NextResponse.json({error:"Origem não permitida"},{status:403});
 const token=await getApiToken();
 try {
  if(token)await backendFetch<void>("/auth/logout",{method:"POST"},token);
  await destroySession();
  return NextResponse.json({ok:true});
 }catch(error){
  await destroySession();
  return clientError(error);
 }
}
