import { BRANDS } from "@/lib/constants";
import { HISTORY_QUESTIONS, completeHistory, normalizeHistory, type VehicleHistory } from "@/lib/vehicle-history";
import { allPages, backendFetch, getApiToken, type SpringPage } from "@/lib/backend";

export type AdStatus = "ATIVO" | "PENDENTE" | "REJEITADO" | "PAUSADO" | "VENDIDO" | "ARQUIVADO" | "SUSPENSO";
export type BackendAd = {
 id:number; codigo:string; titulo:string; descricao:string; preco:number; marca:string; modelo:string; versao:string;
 ano:number; quilometragem:number; combustivel:string; cambio:string; cor:string; status:AdStatus;
 segundaMao:boolean; categoria:string; historicoVeiculo?:VehicleHistory|null; fotoCapaUrl:string|null; usuarioId:number; usuarioNome:string;
 criadoEm:string; veiculoId:number|null; cidade?:string|null; uf?:string|null; motivoRejeicao?:string|null; laudoCautelar?:string|null; documentacao:string; garantia:string;
};
export type CarData = {
 id:number;userId:number;name:string; brand:string;model:string;version:string;year:number;price:number;mileageKm:number;
 fuel:string;transmission:string;color:string;description:string;images:string[];imageIds:number[];
 status:string; statusApi:AdStatus; isDemo?:boolean; createdAt:string; city:string;state:string;vehicleId:number|null;rejectionReason:string|null;
 category:string;secondHand:boolean;vehicleHistory:VehicleHistory|null;documentation:string;warranty:string;inspectionReport:string;
};
export type BackendPhoto = {id:number;url:string;ordem:number;tipoFoto:string;anuncioId:number};

const fromApiStatus: Record<AdStatus, string>={
 ATIVO:"ativo",PENDENTE:"pendente",REJEITADO:"rejeitado",PAUSADO:"pausado",
 VENDIDO:"vendido",ARQUIVADO:"arquivado",SUSPENSO:"suspenso",
};
export function photoUrl(raw: string | null | undefined): string | null {
 if (!raw) return null;
 // Photos are delivered by our same-origin BFF, including owner-only previews.
 const filename=raw.split("/").pop()?.split("?")[0] ?? "";
 return /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}\.(?:jpg|png)$/.test(filename)
  ? `/api/media/${filename}` : null;
}
export function fromBackendAd(ad:BackendAd, photos:BackendPhoto[]=[]):CarData {
 const images: string[] = [];
 const imageIds: number[] = [];
 for (const photo of [...photos].sort((a, b) => a.ordem - b.ordem)) {
  const url = photoUrl(photo.url);
  if (url) {
   images.push(url);
   imageIds.push(photo.id);
  }
 }
 const cover = photoUrl(ad.fotoCapaUrl);
 if (cover && photos.length === 0) images.push(cover);
 return {
  id:ad.id,userId:ad.usuarioId,name:ad.usuarioNome,brand:ad.marca,model:ad.modelo,version:ad.versao,
  year:ad.ano,price:Number(ad.preco),mileageKm:ad.quilometragem,
  fuel:ad.combustivel.toLowerCase(),transmission:ad.cambio.toLowerCase(),color:ad.cor,
  description:ad.descricao, images,imageIds,status:fromApiStatus[ad.status]||"pendente",
  statusApi:ad.status, isDemo:ad.codigo?.startsWith("DEMO-") ?? false, createdAt:ad.criadoEm,city:ad.cidade ?? "",state:ad.uf ?? "",vehicleId:ad.veiculoId,rejectionReason:ad.motivoRejeicao??null,
  category:ad.categoria,secondHand:ad.segundaMao,vehicleHistory:ad.historicoVeiculo?normalizeHistory(ad.historicoVeiculo):null,documentation:ad.documentacao,warranty:ad.garantia,inspectionReport:ad.laudoCautelar||"",
 };
}

export async function adPhotos(id:number, token?:string):Promise<BackendPhoto[]> {
 const photoPage=await backendFetch<SpringPage<BackendPhoto>>(`/v1/anuncio/${id}/fotos?page=0&size=20`,{},token);
 return photoPage.content;
}
// Status de anúncios é sensível à moderação: não cachear 200 após suspensão.
export async function carById(id:number, token?:string):Promise<CarData> {
 const ad=await backendFetch<BackendAd>(`/v1/anuncio/${id}`,{},token);
 const photos=await adPhotos(id,token);
 return fromBackendAd(ad,photos);
}
export async function carSummaryById(id:number, token?:string):Promise<CarData> {
 const ad=await backendFetch<BackendAd>(`/v1/anuncio/${id}`,{},token);
 return fromBackendAd(ad);
}
export async function publicCars(maxPages=10):Promise<CarData[]> {
 const ads=await allPages<BackendAd>("/v1/anuncio",undefined,maxPages);
 return ads.filter(a=>a.status==="ATIVO").map(ad=>fromBackendAd(ad));
}
export async function featuredCars(limit=6):Promise<CarData[]> {
 const page=await backendFetch<SpringPage<BackendAd>>(
  `/v1/anuncio/destaques?page=0&size=${Math.max(1,Math.min(12,limit))}`
 );
 return page.content.map(ad=>fromBackendAd(ad));
}
export type PublicCarFilters={q?:string;tipo?:string;brand?:string;city?:string;state?:string;fuel?:string;transmission?:string;minPrice?:number;maxPrice?:number;yearMin?:number;sort?:string;page?:number};
export async function searchPublicCars(filters:PublicCarFilters):Promise<{cars:CarData[];total:number;totalPages:number;page:number}> {
 const params=new URLSearchParams();
 const values:Record<string,string|undefined>={q:filters.q,tipo:filters.tipo,marca:filters.brand,cidade:filters.city,uf:filters.state,combustivel:filters.fuel?.toUpperCase(),cambio:filters.transmission?.toUpperCase(),precoMin:filters.minPrice?.toString(),precoMax:filters.maxPrice?.toString(),anoMin:filters.yearMin?.toString(),sort:filters.sort??"recentes",page:String(filters.page??0),size:"18"};
 for(const [key,value] of Object.entries(values))if(value)params.set(key,value);
 const result=await backendFetch<SpringPage<BackendAd>>(`/v1/anuncio/buscar?${params.toString()}`);
 const cars=result.content.map(ad=>fromBackendAd(ad));
 return {cars,total:result.totalElements,totalPages:result.totalPages,page:result.number};
}
export async function myCars():Promise<CarData[]> {
 const token=await getApiToken();
 if(!token) return [];
 const ads=await allPages<BackendAd>("/v1/anuncio/meus",token);
 return ads.map(ad=>fromBackendAd(ad));
}

export type CarFormInput={brand:string;model:string;version?:string|null;year:number;price:number;mileageKm:number;
 fuel:string;transmission:string;color:string;vehicleHistory:VehicleHistory;city?:string;state?:string;description:string;category?:string;secondHand?:boolean;documentation?:string;warranty?:string;inspectionReport?:string;};
const fuelList=["GASOLINA","ETANOL","FLEX","DIESEL","ELETRICO","HIBRIDO"];
const categoryList=["SEMINOVOS","PREMIUM","BLINDADOS","CONSIGNACAO"];
const transmissionList=["MANUAL","AUTOMATICO","AUTOMATIZADO"];
export function apiAdPayload(form:CarFormInput, allowLegacyMoto = false) {
 const combustivel=form.fuel.toUpperCase(), cambio=form.transmission.toUpperCase();
 if(!fuelList.includes(combustivel)||!transmissionList.includes(cambio)) throw new Error("Combustível ou câmbio não suportado pela API.");
 if(form.category && !categoryList.includes(form.category) && !(allowLegacyMoto && form.category==="MOTOS"))throw new Error("Categoria inválida.");
 if(!form.brand?.trim()||!form.model?.trim()||!form.color?.trim()||!form.description?.trim())throw new Error("Preencha os dados obrigatórios.");
 if(!BRANDS.some((brand)=>brand===form.brand.trim()))throw new Error("Marca de veículo inválida.");
 if(!completeHistory(form.vehicleHistory))throw new Error("Responda ao histórico e às condições do veículo.");
 if(HISTORY_QUESTIONS.some(({key})=>form.vehicleHistory[`detalhes${key.charAt(0).toUpperCase()}${key.slice(1)}` as keyof VehicleHistory]?.length>500))throw new Error("Detalhes do histórico excedem 500 caracteres.");
 const cidade=form.city?.trim() ?? "";
 const uf=form.state?.trim().toUpperCase() ?? "";
 const validUF=["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
 if(!cidade || cidade.length>100 || !validUF.includes(uf))
  throw new Error("Informe cidade e UF do veículo. A localização é declarada pelo anunciante.");
 if(!Number.isFinite(form.price)||form.price<=0||!Number.isInteger(form.year)||form.year<1900||form.year>new Date().getFullYear()+1||!Number.isFinite(form.mileageKm)||form.mileageKm<0)throw new Error("Preço, ano ou quilometragem inválidos.");
 return {
  marca:form.brand.trim(),modelo:form.model.trim(),
  ano:form.year,preco:form.price,quilometragem:form.mileageKm,cor:form.color.trim(),combustivel,cambio,
  descricao:form.description.trim().slice(0,255),titulo:`${form.brand.trim()} ${form.model.trim()} ${form.year}`.slice(0,255),
  cidade,uf,
  categoria:form.category||"SEMINOVOS",historicoVeiculo:form.vehicleHistory,documentacao:form.documentation?.trim()||"A verificar",garantia:form.warranty?.trim()||"Não informada",laudoCautelar:form.inspectionReport?.trim()||null,
 };
}
