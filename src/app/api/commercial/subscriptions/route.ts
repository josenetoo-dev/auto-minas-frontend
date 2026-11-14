import { NextResponse } from "next/server";
import { clientError, privateApi } from "@/lib/backend";
export async function GET() { try { return NextResponse.json(await privateApi("/v1/assinaturas/minhas?page=0&size=100")); } catch (error) { return clientError(error); } }
