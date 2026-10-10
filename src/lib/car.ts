import { allPages, backendFetch, getApiToken, type SpringPage } from "@/lib/backend";

export type AdStatus = "ATIVO" | "PENDENTE" | "REJEITADO" | "PAUSADO" | "VENDIDO" | "ARQUIVADO" | "SUSPENSO";
export type BackendAd = {
 id:number; codigo:string; titulo:string; descricao:string; preco:number; marca:string; modelo:string; versao:string;
 ano:number; quilometragem:number; combustivel:string; cambio:string; cor:string; status:AdStatus;
 segundaMao:boolean; categoria:string; fotoCapaUrl:string|null; usuarioId:number; usuarioNome:string;
 criadoEm:string; veiculoId:number|null; motivoRejeicao?:string|null; laudoCautelar?:string|null; documentacao:string; garantia:string;
};
export type CarData = {
 id:number;userId:number;name:string; brand:string;model:string;version:string;year:number;price:number;mileageKm:number;
 fuel:string;transmission:string;color:string;description:string;images:string[];imageIds:number[];
 status:string; statusApi:AdStatus; createdAt:string; city:string;state:string;vehicleId:number|null;rejectionReason:string|null;
 category:string;secondHand:boolean;documentation:string;warranty:string;inspectionReport:string;
};
export type BackendPhoto = {id:number;url:string;ordem:number;tipoFoto:string;anuncioId:number};

const fromApiStatus: Record<AdStatus, string>={
 ATIVO:"ativo",PENDENTE:"pendente",REJEITADO:"rejeitado",PAUSADO:"pausado",
 VENDIDO:"vendido",ARQUIVADO:"arquivado",SUSPENSO:"suspenso",
};
function photoUrl(raw: string | null | undefined): string | null {
 if (!raw) return null;
 // Photos are delivered by our same-origin BFF, including owner-only previews.
 const filename=raw.split("/").pop()?.split("?")[0] ?? "";
 return /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}\.(?:jpg|png)$/.test(filename)
  ? `/api/media/${filename}` : null;
}
export function fromBackendAd(ad:BackendAd, photos:BackendPhoto[]=[]):CarData {
 const imgs=photos.sort((a,b)=>a.ordem-b.ordem).map(p=>photoUrl(p.url)).filter((x):x is string=>!!x);
 const cover=photoUrl(ad.fotoCapaUrl);
 if (cover && !imgs.includes(cover) && photos.length === 0) imgs.unshift(cover);
 return {
  id:ad.id,userId:ad.usuarioId,name:ad.usuarioNome,brand:ad.marca,model:ad.modelo,version:ad.versao,
  year:ad.ano,price:Number(ad.preco),mileageKm:ad.quilometragem,
  fuel:ad.combustivel.toLowerCase(),transmission:ad.cambio.toLowerCase(),color:ad.cor,
  description:ad.descricao, images:imgs,imageIds:photos.map(p=>p.id),status:fromApiStatus[ad.status]||"pendente",
  statusApi:ad.status, createdAt:ad.criadoEm,city:"",state:"",vehicleId:ad.veiculoId,rejectionReason:ad.motivoRejeicao??null,
  category:ad.categoria,secondHand:ad.segundaMao,documentation:ad.documentacao,warranty:ad.garantia,inspectionReport:ad.laudoCautelar||"",
 };
}

export async function adPhotos(id:number, token?:string):Promise<BackendPhoto[]> {
 const photoPage=await backendFetch<SpringPage<BackendPhoto>>(`/v1/anuncio/${id}/fotos?page=0&size=20`,{},token);
 return photoPage.content;
}
export async function carById(id:number, token?:string):Promise<CarData> {
 const ad=await backendFetch<BackendAd>(`/v1/anuncio/${id}`,{},token);
 const photos=await adPhotos(id,token);
 return fromBackendAd(ad,photos);
}
export async function publicCars(maxPages=10):Promise<CarData[]> {
 const ads=await allPages<BackendAd>("/v1/anuncio",undefined,maxPages);
 return Promise.all(ads.filter(a=>a.status==="ATIVO").map(async ad=>{
  try {return fromBackendAd(ad,await adPhotos(ad.id));}
  catch {return fromBackendAd(ad);}
 }));
}
export async function myCars():Promise<CarData[]> {
 const token=await getApiToken();
 if(!token) return [];
 const ads=await allPages<BackendAd>("/v1/anuncio/meus",token);
 return Promise.all(ads.map(async ad=>{
  try{return fromBackendAd(ad,await adPhotos(ad.id,token));}
  catch{return fromBackendAd(ad);}
 }));
}

export type CarFormInput={brand:string;model:string;version?:string|null;year:number;price:number;mileageKm:number;
 fuel:string;transmission:string;color:string;description:string;category?:string;secondHand?:boolean;documentation?:string;warranty?:string;inspectionReport?:string;};
const fuelList=["GASOLINA","ETANOL","FLEX","DIESEL","ELETRICO","HIBRIDO"];
const categoryList=["SEMINOVOS","PREMIUM","BLINDADOS","MOTOS","CONSIGNACAO"];
const transmissionList=["MANUAL","AUTOMATICO","AUTOMATIZADO"];
export function apiAdPayload(form:CarFormInput) {
 const combustivel=form.fuel.toUpperCase(), cambio=form.transmission.toUpperCase();
 if(!fuelList.includes(combustivel)||!transmissionList.includes(cambio)) throw new Error("Combustível ou câmbio não suportado pela API.");
 if(form.category && !categoryList.includes(form.category))throw new Error("Categoria inválida.");
 if(!form.brand?.trim()||!form.model?.trim()||!form.color?.trim()||!form.description?.trim())throw new Error("Preencha os dados obrigatórios.");
 if(!Number.isFinite(form.price)||form.price<=0||!Number.isFinite(form.year)||!Number.isFinite(form.mileageKm)||form.mileageKm<0)throw new Error("Preço, ano ou quilometragem inválidos.");
 return {
  marca:form.brand.trim(),modelo:form.model.trim(),versao:form.version?.trim()||"Não informada",
  ano:form.year,preco:form.price,quilometragem:form.mileageKm,cor:form.color.trim(),combustivel,cambio,
  descricao:form.description.trim().slice(0,255),titulo:`${form.brand.trim()} ${form.model.trim()} ${form.year}`.slice(0,255),
  categoria:form.category||"SEMINOVOS",segundaMao:form.secondHand??true,documentacao:form.documentation?.trim()||"A verificar",garantia:form.warranty?.trim()||"Não informada",laudoCautelar:form.inspectionReport?.trim()||null,
 };
}
