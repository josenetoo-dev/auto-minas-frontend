import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { backendFetch, clientError, getApiToken, sameOrigin, SESSION_REFRESH_COOKIE } from "@/lib/backend";
import { cookies } from "next/headers";
export async function POST(request:Request){
 if(!sameOrigin(request))return NextResponse.json({error:"Origem não permitida"},{status:403});
 const token=await getApiToken();
 const refresh=(await cookies()).get(SESSION_REFRESH_COOKIE)?.value;
 try {
  if(refresh)await backendFetch<void>("/auth/session/revoke",{method:"POST",body:JSON.stringify({refreshToken:refresh})});
  if(token)await backendFetch<void>("/auth/logout",{method:"POST"},token);
  await destroySession();
  return NextResponse.json({ok:true});
 }catch(error){
  await destroySession();
  return clientError(error);
 }
}
