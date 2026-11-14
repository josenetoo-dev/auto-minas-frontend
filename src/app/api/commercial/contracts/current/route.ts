import { backendFetch, clientError } from "@/lib/backend";
import type { CommercialContract } from "@/lib/commercial";

export async function GET() {
  try { return Response.json(await backendFetch<CommercialContract>("/v1/contratos/atual")); }
  catch (error) { return clientError(error); }
}
