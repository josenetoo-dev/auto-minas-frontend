import { NextResponse } from "next/server";
import { API_URL } from "@/lib/backend";
export async function GET(){
 try {const response=await fetch(`${API_URL}/v1/anuncio?size=1`,{cache:"no-store",signal:AbortSignal.timeout(3500)});
  return NextResponse.json({frontend:"ok",api:response.ok?"ok":"error",upstreamStatus:response.status},{status:response.ok?200:503});
 }catch{return NextResponse.json({frontend:"ok",api:"unavailable"},{status:503});}
}
