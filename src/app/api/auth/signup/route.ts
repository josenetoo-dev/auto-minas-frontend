import { NextResponse } from "next/server";
import { backendFetch, clientError, sameOrigin } from "@/lib/backend";
import { createSession } from "@/lib/auth";
import { safeNextPath } from "@/lib/redirect";
export async function POST(request:Request) {
 if(!sameOrigin(request))return NextResponse.json({error:"Origem não permitida"},{status:403});
 try {
  const b=await request.json() as {name?:string;email?:string;password?:string;phone?:string;next?:string};
  const phone=(b.phone||"").replace(/\D/g,"");
  if(!b.name?.trim()||!b.email?.trim()||!b.password||!/^\d{10,11}$/.test(phone))
   return NextResponse.json({error:"Informe nome, e-mail, senha forte e telefone com DDD."},{status:400});
  await backendFetch("/auth/register",{method:"POST",body:JSON.stringify({nome:b.name.trim(),email:b.email.trim().toLowerCase(),senha:b.password,telefone:phone})});
  const result=await backendFetch<{token:string}>("/auth/login",{
   method:"POST",body:JSON.stringify({email:b.email.trim().toLowerCase(),senha:b.password})
  });
  await createSession(result.token);
  return NextResponse.json({ok:true,redirect:safeNextPath(b.next,"/conta"),message:"Conta criada. Confirme seu e-mail para liberar os anúncios."});
 }catch(e){return clientError(e);}
}
