import { NextResponse } from "next/server";
import { privateApi, clientError, sameOrigin, type SpringPage } from "@/lib/backend";
import type { PrivacyRequest } from "@/components/privacy-requests";
export async function POST(request:Request) {
 if(!sameOrigin(request))return NextResponse.json({error:"Origem não permitida"},{status:403});
 try {return NextResponse.json(await privateApi<PrivacyRequest>("/v1/privacidade/solicitacoes",{method:"POST"}),{status:202});}
 catch(error){return clientError(error);}
}
export async function GET() {
 try {return NextResponse.json(await privateApi<SpringPage<PrivacyRequest>>("/v1/privacidade/solicitacoes"));}
 catch(error){return clientError(error);}
}
