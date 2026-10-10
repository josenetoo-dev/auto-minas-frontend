import { backendFetch, getApiToken, allPages } from "@/lib/backend";
import { carById, type CarData } from "@/lib/car";

export type ChatOther = {id:number;name:string;avatarUrl:string|null};
export type ChatCar = {id:number;brand:string;model:string;year:number;price:number;image:string|null;status:string};
export type ChatSummary = {id:number;carId:number;car:ChatCar|null;other:ChatOther;lastMessage:string|null;lastAt:string;unread:number;status:string;value:number};
export type ChatMessageDTO={id:number;senderId:number;content:string;createdAt:string;readAt:string|null};
export type ChatThread={conversation:{id:number;carId:number;myRole:"buyer"|"seller";status:string;value:number};car:ChatCar|null;other:ChatOther|null;messages:ChatMessageDTO[]};
export type BackendProposal={id:number;valor:number;descricao:string;status:string;criadoEm:string;anuncio:number;comprador:number;contrapropostaValor:number|null;contrapropostaDescricao:string|null;contrapropostaFeita:boolean};
export type BackendMessage={id:number;propostaId:number;remetenteId:number;remetenteNome:string;conteudo:string;criadoEm:string};
function chatCar(c:CarData|null):ChatCar|null {return c?{id:c.id,brand:c.brand,model:c.model,year:c.year,price:c.price,image:c.images[0]||null,status:c.status}:null;}
async function carSafe(id:number,token:string):Promise<CarData|null>{try{return await carById(id,token);}catch{return null;}}
async function otherName(id:number,token:string):Promise<ChatOther>{
 try{const d=await backendFetch<{id:number;nome:string}>(`/v1/usuario/${id}`,{},token);return{id:d.id,name:d.nome,avatarUrl:null};}
 catch{return{id,name:"Participante",avatarUrl:null};}
}
export async function getConversationSummaries(userId:number):Promise<ChatSummary[]> {
 const token=await getApiToken();if(!token)return [];
 const proposals=await allPages<BackendProposal>("/v1/proposta/minhas",token);
 return Promise.all(proposals.map(async p=>{
  const car=await carSafe(p.anuncio,token);
  const partnerId=p.comprador===userId?(car?.userId??0):p.comprador;
  const other=partnerId?await otherName(partnerId,token):{id:0,name:"Participante",avatarUrl:null};
  return {id:p.id,carId:p.anuncio,car:chatCar(car),other,lastMessage:p.descricao,lastAt:p.criadoEm,unread:0,status:p.status,value:Number(p.valor)};
 }));
}
export async function getChatThread(userId:number,id:number):Promise<ChatThread|null>{
 const token=await getApiToken();if(!token)return null;
 let p:BackendProposal;try{p=await backendFetch<BackendProposal>(`/v1/proposta/${id}`,{},token);}catch{return null;}
 const car=await carSafe(p.anuncio,token);
 const isBuyer=p.comprador===userId;
 const partnerId=isBuyer?(car?.userId??0):p.comprador;
 const other=partnerId?await otherName(partnerId,token):{id:0,name:"Participante",avatarUrl:null};
 const messages=await allPages<BackendMessage>(`/v1/proposta/${id}/mensagens`,token);
 return {conversation:{id:p.id,carId:p.anuncio,myRole:isBuyer?"buyer":"seller",status:p.status,value:Number(p.valor)},
  car:chatCar(car),other,messages:messages.map(m=>({id:m.id,senderId:m.remetenteId,content:m.conteudo,createdAt:m.criadoEm,readAt:null}))
   .sort((a,b)=>new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime())};
}
/** Backend does not implement read receipts; never invent an unread count. */
export async function countUnreadMessages():Promise<number>{return 0;}
