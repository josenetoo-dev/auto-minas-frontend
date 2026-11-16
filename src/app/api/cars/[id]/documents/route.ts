import { NextResponse } from "next/server";
import { allPages, clientError, getApiToken, privateApi, sameOrigin, BackendError } from "@/lib/backend";
import type { BackendAd } from "@/lib/car";

type Case = { id:number; tipo:string; status:string; veiculoId:number|null };
type Evidence = { id:number; tipo:string };
type Context = { params:Promise<{id:string}> };

async function ownedAd(context:Context) {
  const id=(await context.params).id;
  if (!/^[1-9]\d*$/.test(id)) throw new BackendError(400,"Anúncio inválido.");
  const [ad, user]=await Promise.all([
    privateApi<BackendAd>(`/v1/anuncio/${id}`),
    privateApi<{id:number}>("/v1/usuario/me"),
  ]);
  if(ad.usuarioId !== user.id) throw new BackendError(403,"Você só pode enviar documentos dos seus anúncios.");
  if(!ad.veiculoId) throw new BackendError(409,"O veículo deste anúncio ainda não está disponível.");
  return ad;
}

async function state(ad:BackendAd) {
  const token=await getApiToken();
  const cases=await allPages<Case>("/v1/verificacoes/minhas",token!);
  const relevant=cases.filter(item=>item.tipo==="IDENTIDADE" || item.veiculoId===ad.veiculoId);
  return Promise.all(relevant.map(async item=>({
    ...item, evidencias:await privateApi<Evidence[]>(`/v1/verificacoes/${item.id}/evidencias`),
  })));
}

export async function GET(_request:Request,context:Context) {
  try {
    const ad=await ownedAd(context);
    return NextResponse.json({cases:await state(ad)});
  } catch(error) { return clientError(error); }
}

export async function POST(request:Request,context:Context) {
  if(!sameOrigin(request)) return NextResponse.json({error:"Origem não permitida"},{status:403});
  try {
    const ad=await ownedAd(context);
    if(request.headers.get("content-type")?.includes("application/json")) {
      const submission=await request.json();
      const manual=submission?.manual===true;
      const cases=await state(ad);
      for(const type of ["IDENTIDADE","VEICULO"]) {
        const item=cases.find(c=>c.tipo===type);
        const required=type==="IDENTIDADE"?["IDENTIDADE_FRENTE","IDENTIDADE_VERSO"]:["DOCUMENTO_VEICULO"];
        if(!item || required.some(kind=>!item.evidencias.some(e=>e.tipo===kind))) {
          throw new BackendError(400,type==="IDENTIDADE"?"Envie frente e verso do documento de identidade.":"Envie o documento do veículo.");
        }
        if(["RASCUNHO","REJEITADA","CORRECAO_NECESSARIA","EXPIRADA"].includes(item.status)) {
          await privateApi(`/v1/verificacoes/${item.id}/${manual?"analise-manual":"enviar"}`,{method:"POST"});
        }
      }
      return NextResponse.json({ok:true});
    }
    const form=await request.formData();
    const kind=form.get("tipo");
    const file=form.get("arquivo");
    if(typeof kind!=="string" || !["IDENTIDADE_FRENTE","IDENTIDADE_VERSO","DOCUMENTO_VEICULO"].includes(kind)
      || !(file instanceof File) || !file.size || file.size>4*1024*1024
      || !["image/jpeg","image/png"].includes(file.type)) {
      throw new BackendError(400,"Envie um documento JPG ou PNG de até 4 MiB.");
    }
    const path=kind==="DOCUMENTO_VEICULO"?`/v1/verificacoes/veiculos/${ad.veiculoId}`:"/v1/verificacoes/identidade";
    const item=await privateApi<Case>(path,{method:"POST"});
    await privateApi(`/v1/verificacoes/${item.id}/evidencias`,{method:"POST",body:form});
    return NextResponse.json({ok:true},{status:201});
  } catch(error) { return clientError(error); }
}
