import { NextResponse } from "next/server";
/** The legacy standalone upload API produced orphan files untracked by Spring. */
export async function POST(){return NextResponse.json({error:"Selecione imagens no anúncio; elas serão enviadas à API depois de salvar."},{status:410});}
