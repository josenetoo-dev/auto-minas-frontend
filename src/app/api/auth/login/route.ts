import { NextResponse } from "next/server";
import { backendFetch, clientError, sameOrigin } from "@/lib/backend";
import { createSession } from "@/lib/auth";
export async function POST(request:Request) {
 if(!sameOrigin(request))return NextResponse.json({error:"Origem não permitida"},{status:403});
 try {
  const body=await request.json() as {email?:string;password?:string;next?:string};
  if(!body.email||!body.password)return NextResponse.json({error:"Informe e-mail e senha."},{status:400});
  const result=await backendFetch<{token:string}>("/auth/login",{
   method:"POST",body:JSON.stringify({email:body.email.trim().toLowerCase(),senha:body.password})
  });
  await createSession(result.token);
  const next=body.next?.startsWith("/")&&!body.next.startsWith("//")?body.next:"/conta";
  return NextResponse.json({ok:true,redirect:next});
 }catch(e){return clientError(e);}
}
