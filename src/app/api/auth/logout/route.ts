import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { sameOrigin } from "@/lib/backend";
export async function POST(request:Request){
 if(!sameOrigin(request))return NextResponse.json({error:"Origem não permitida"},{status:403});
 await destroySession();return NextResponse.json({ok:true});
}
