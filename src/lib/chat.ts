import { backendFetch, getApiToken, allPages } from "@/lib/backend";
import { carSummaryById, type CarData } from "@/lib/car";

export type ChatOther = {id:number;name:string;avatarUrl:string|null};
export type ChatCar = {id:number;brand:string;model:string;year:number;price:number;image:string|null;status:string};
export type ChatSummary = {id:number;carId:number;car:ChatCar|null;other:ChatOther;lastMessage:string|null;lastAt:string;unread:number;status:string;value:number;myRole:"buyer"|"seller"};
export type ChatMessageDTO={id:number;proposalId?:number;pending?:boolean;failed?:boolean;senderId:number;content:string|null;createdAt:string;readAt:string|null;deleted?:boolean;attachment?:{name:string;mime:string;size:number;url:string}};
export type ChatThread={conversation:{id:number;carId:number;myRole:"buyer"|"seller";status:string;value:number};car:ChatCar|null;other:ChatOther|null;messages:ChatMessageDTO[]};
export type BackendProposal={id:number;valor:number;descricao:string;status:string;criadoEm:string;anuncio:number;comprador:number;contrapropostaValor:number|null;contrapropostaDescricao:string|null;contrapropostaFeita:boolean};
export type BackendMessage={id:number;propostaId:number;remetenteId:number;remetenteNome:string;conteudo:string|null;criadoEm:string;lidaEm?:string|null;excluida?:boolean;arquivoNome?:string|null;tipoMidia?:string|null;arquivoTamanho?:number|null;anexoDisponivel?:boolean};
function chatCar(c:CarData|null):ChatCar|null {return c?{id:c.id,brand:c.brand,model:c.model,year:c.year,price:c.price,image:c.images[0]||null,status:c.status}:null;}
async function carSafe(id:number,token:string):Promise<CarData|null>{try{return await carSummaryById(id,token);}catch{return null;}}
async function otherName(id:number,token:string):Promise<ChatOther>{
 try{const d=await backendFetch<{nome:string;temFoto:boolean}>(`/v1/perfis/${id}`,{},token);return{id,name:d.nome,avatarUrl:d.temFoto?`/perfil/${id}/foto`:null};}
 catch{return{id,name:"Participante",avatarUrl:null};}
}
export async function getConversationSummaries(userId:number):Promise<ChatSummary[]> {
 const token=await getApiToken();if(!token)return [];
 const [proposals, unread] = await Promise.all([allPages<BackendProposal>("/v1/proposta/minhas",token), unreadByProposal(token)]);
 const carCache=new Map<number,Promise<CarData|null>>();
 const otherCache=new Map<number,Promise<ChatOther>>();
 const getCar=(id:number)=>{
  const cached=carCache.get(id);
  if(cached)return cached;
  const pending=carSafe(id,token);
  carCache.set(id,pending);
  return pending;
 };
 const getOther=(id:number)=>{
  const cached=otherCache.get(id);
  if(cached)return cached;
  const pending=otherName(id,token);
  otherCache.set(id,pending);
  return pending;
 };
 const conversations:ChatSummary[] = await Promise.all(proposals.map(async p=>{
  const car=await getCar(p.anuncio);
  const partnerId=p.comprador===userId?(car?.userId??0):p.comprador;
  const other=partnerId?await getOther(partnerId):{id:0,name:"Participante",avatarUrl:null};
  return {id:p.id,carId:p.anuncio,car:chatCar(car),other,lastMessage:p.descricao,lastAt:p.criadoEm,unread:unread[p.id] ?? 0,status:p.status,value:Number(p.valor),myRole:p.comprador===userId?"buyer":"seller"};
 }));
 const grouped = new Map<string,ChatSummary>();
 for (const item of conversations.sort((a,b)=>a.id-b.id)) {
  const key=`${item.myRole}:${item.other.id || -item.id}:${item.carId}`;
  const existing=grouped.get(key);
  if(existing) existing.unread += item.unread;
  else grouped.set(key,item);
 }
 return [...grouped.values()];
}
export async function getChatThread(userId:number,id:number):Promise<ChatThread|null>{
 const token=await getApiToken();if(!token)return null;
 let p:BackendProposal;try{p=await backendFetch<BackendProposal>(`/v1/proposta/${id}`,{},token);}catch{return null;}
 const car=await carSafe(p.anuncio,token);
 const isBuyer=p.comprador===userId;
 const partnerId=isBuyer?(car?.userId??0):p.comprador;
 const other=partnerId?await otherName(partnerId,token):{id:0,name:"Participante",avatarUrl:null};
 const ids = await backendFetch<number[]>(`/v1/proposta/${id}/relacionadas`,{},token);
 if(!ids.includes(id))ids.push(id);
 const messages=(await Promise.all(ids.map(proposalId=>allPages<BackendMessage>(`/v1/proposta/${proposalId}/mensagens`,token)))).flat();
 return {conversation:{id:p.id,carId:p.anuncio,myRole:isBuyer?"buyer":"seller",status:p.status,value:Number(p.valor)},
  car:chatCar(car),other,messages:messages.map(m=>({id:m.id,proposalId:m.propostaId,senderId:m.remetenteId,content:m.conteudo,createdAt:m.criadoEm,readAt:m.lidaEm ?? null,deleted:m.excluida,...(m.anexoDisponivel?{attachment:{name:m.arquivoNome??"Imagem",mime:m.tipoMidia??"image/jpeg",size:m.arquivoTamanho??0,url:`/api/conversations/${m.propostaId}/attachments?messageId=${m.id}`}}:{})}))
   .sort((a,b)=>new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime())};
}
async function unreadByProposal(token:string) {
 return backendFetch<Record<string,number>>("/v1/proposta/mensagens-nao-lidas", {}, token);
}
export async function countUnreadMessages():Promise<number>{
 const token=await getApiToken();
 if(!token)return 0;
 return Object.values(await unreadByProposal(token)).reduce((sum,count)=>sum+count,0);
}
