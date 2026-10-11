import { NextResponse } from "next/server";
/** Read receipts are not supported by the Spring API. Don't claim otherwise. */
export async function POST(){return NextResponse.json({error:"Confirmações de leitura ainda não estão disponíveis."},{status:501});}
