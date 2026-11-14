import { NextResponse } from "next/server";
import { clientError, privateApi } from "@/lib/backend";
export async function GET() { try { return NextResponse.json(await privateApi("/v1/contratos/meus-aceites")); } catch (error) { return clientError(error); } }
