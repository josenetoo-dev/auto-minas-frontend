import { NextResponse } from "next/server";
import { clientError, privateApi, sameOrigin } from "@/lib/backend";

export async function PUT(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida" }, { status: 403 });
  try {
    const body = await request.json() as { mensalidade?: unknown };
    const raw = String(body.mensalidade ?? "");
    const price = Number(raw);
    if (!/^\d{1,8}(\.\d{1,2})?$/.test(raw) || !Number.isFinite(price) || price <= 0)
      return NextResponse.json({ error: "Informe o preço aprovado em reais, com até duas casas decimais." }, { status: 400 });
    return NextResponse.json(await privateApi("/v1/planos/AUTO_MINAS_PRO/preco", {
      method: "PUT", body: JSON.stringify({ mensalidade: price }),
    }));
  } catch (error) { return clientError(error); }
}
