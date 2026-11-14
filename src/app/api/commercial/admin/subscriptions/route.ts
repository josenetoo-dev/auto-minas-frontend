import { NextResponse } from "next/server";
import { clientError, privateApi } from "@/lib/backend";
export async function GET() {
  try { return NextResponse.json(await privateApi("/v1/assinaturas/admin?page=0&size=100&sort=criadoEm,desc")); }
  catch (error) { return clientError(error); }
}
