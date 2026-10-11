import { NextResponse } from "next/server";
import { backendFetch, clientError, sameOrigin } from "@/lib/backend";
export async function POST(request:Request) {
 if(!sameOrigin(request))return NextResponse.json({error:"Origem não permitida"},{status:403});
 try {
  const b=await request.json() as {name?:string;email?:string;password?:string;phone?:string};
  const phone=(b.phone||"").replace(/\D/g,"");
  if(!b.name?.trim()||!b.email?.trim()||!b.password||!/^\d{10,11}$/.test(phone))
   return NextResponse.json({error:"Informe nome, e-mail, senha forte e telefone com DDD."},{status:400});
  await backendFetch("/auth/register",{method:"POST",body:JSON.stringify({nome:b.name.trim(),email:b.email.trim().toLowerCase(),senha:b.password,telefone:phone})});
  // Never silently create a local user. New account requires email confirmation.
  return NextResponse.json({ok:true,redirect:"/login?registered=1",message:"Conta criada. Entre e confirme seu e-mail antes de anunciar."});
 }catch(e){return clientError(e);}
}
