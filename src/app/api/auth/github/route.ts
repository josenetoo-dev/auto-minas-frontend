import { beginOAuth } from "@/lib/oauth";
export async function GET(request: Request) { return beginOAuth(request, "github"); }
