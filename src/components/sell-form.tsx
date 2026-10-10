"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BRANDS, FUEL_OPTIONS, TRANSMISSION_OPTIONS } from "@/lib/constants";

export type SellFormData={brand:string;model:string;version:string;year:string;price:string;mileageKm:string;fuel:string;transmission:string;color:string;city:string;state:string;description:string;category:string;secondHand:boolean;documentation:string;warranty:string;inspectionReport:string;images:string[];imageIds?:number[]};
const EMPTY:SellFormData={brand:"",model:"",version:"",year:String(new Date().getFullYear()),price:"",mileageKm:"",fuel:"",transmission:"",color:"",city:"",state:"MG",description:"",category:"SEMINOVOS",secondHand:true,documentation:"A verificar",warranty:"Não informada",inspectionReport:"",images:[]};
const UF_LIST=["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"] as const;
const MAX_FILE=5*1024*1024;
export default function SellForm({mode,carId,initial}:{mode:"create"|"edit";carId?:number;initial?:Partial<SellFormData>}) {
 const router=useRouter();
 const [data,setData]=useState<SellFormData>({...EMPTY,...initial});
 const [files,setFiles]=useState<File[]>([]);
 const [previews,setPreviews]=useState<string[]>([]);
 const [removed,setRemoved]=useState<number[]>([]);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const [createdId,setCreatedId]=useState<number|null>(null);
 function update(key:keyof SellFormData,value:string|boolean){setData(old=>({...old,[key]:value}));}
 useEffect(()=>{const urls=files.map(f=>URL.createObjectURL(f));setPreviews(urls);return ()=>urls.forEach(u=>URL.revokeObjectURL(u));},[files]);
 function addPhotos(selected:FileList|null) {
  if(!selected)return;
  const next=Array.from(selected);
  if(next.some(f=>!["image/jpeg","image/png"].includes(f.type)||f.size<=0||f.size>MAX_FILE)){
    setError("Envie apenas JPG ou PNG de até 5 MB por imagem.");return;
  }
  if(files.length+next.length+data.images.length-removed.length>20){setError("O limite é 20 fotos por anúncio.");return;}
  setFiles(list=>[...list,...next]);setError("");
 }
 async function save(e:React.FormEvent) {
  e.preventDefault();if(busy)return;
  setBusy(true);setError("");
  let id=createdId||carId;
  try {
   if(!id){
    const body={...data,year:Number(data.year),price:Number(data.price),mileageKm:Number(data.mileageKm)};
    const response=await fetch("/api/cars",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const json=await response.json();if(!response.ok)throw new Error(json.error||"Não foi possível cadastrar o anúncio.");
    id=json.id;setCreatedId(id!);
   }else {
    const body={...data,year:Number(data.year),price:Number(data.price),mileageKm:Number(data.mileageKm)};
    const response=await fetch(`/api/cars/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const json=await response.json();if(!response.ok)throw new Error(json.error||"Não foi possível editar o anúncio.");
   }
   if(!id)throw new Error("A API não devolveu o número do anúncio.");
   for(const photoId of removed){
    const response=await fetch(`/api/cars/${id}/photos?fotoId=${photoId}`,{method:"DELETE"});
    if(!response.ok)throw new Error("Anúncio salvo, mas uma imagem antiga não pôde ser removida.");
   }
   for(let index=0;index<files.length;index+=10){
    const form=new FormData();for(const file of files.slice(index,index+10))form.append("fotos",file);
    const response=await fetch(`/api/cars/${id}/photos`,{method:"POST",body:form});
    if(!response.ok){const json=await response.json().catch(()=>({}));throw new Error(json.error||"Anúncio salvo, mas uma foto não pôde ser enviada.");}
   }
   router.push(`/meus-anuncios?salvo=${id}`);router.refresh();
  }catch(err){setError((err instanceof Error?err.message:"Falha de conexão.")+(id?" Os dados salvos estão em Meus anúncios.":""));}
  finally{setBusy(false);}
 }
 const input=(label:string,key:keyof SellFormData,opts?:{type?:string;required?:boolean;min?:number;max?:number;placeholder?:string})=>(
  <div><label htmlFor={String(key)} className="label-dark">{label}</label>
    <input id={String(key)} type={opts?.type||"text"} required={opts?.required} min={opts?.min} max={opts?.max}
     placeholder={opts?.placeholder} value={String(data[key]||"")}
     onChange={e=>update(key,e.target.value)} className="input-dark" /></div>
 );
 return <form onSubmit={save} className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_310px]">
  <div className="space-y-6">
   <section className="card-dark space-y-5 p-6">
    <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#d4af37]">01 / Cadastro</p>
    <h2 className="font-display mt-2 text-2xl font-bold">Dados do veículo</h2></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div><label htmlFor="brand" className="label-dark">Marca *</label><select required id="brand" value={data.brand} className="input-dark" onChange={e=>update("brand",e.target.value)}><option value="">Selecione</option>{BRANDS.map(x=><option key={x}>{x}</option>)}</select></div>
      {input("Modelo *","model",{required:true,placeholder:"Ex.: Onix LT"})}
      {input("Versão","version",{placeholder:"Ex.: 1.0 Flex"})}
      {input("Ano *","year",{type:"number",min:1900,max:new Date().getFullYear()+1,required:true})}
      {input("Quilometragem *","mileageKm",{type:"number",min:0,required:true})}
      {input("Cor *","color",{required:true})}
      {input("Cidade onde está o veículo *","city",{required:true,placeholder:"Ex.: Várzea da Palma"})}
      <div><label htmlFor="state" className="label-dark">UF *</label><select id="state" required className="input-dark" value={data.state} onChange={e=>update("state",e.target.value)}>
        <option value="">Selecione</option>{UF_LIST.map(uf=><option key={uf} value={uf}>{uf}</option>)}
      </select></div>
      <div><label htmlFor="fuel" className="label-dark">Combustível *</label><select required id="fuel" className="input-dark" value={data.fuel} onChange={e=>update("fuel",e.target.value)}><option value="">Selecione</option>{FUEL_OPTIONS.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></div>
      <div><label htmlFor="transmission" className="label-dark">Câmbio *</label><select required id="transmission" className="input-dark" value={data.transmission} onChange={e=>update("transmission",e.target.value)}><option value="">Selecione</option>{TRANSMISSION_OPTIONS.filter(x=>x.value!=="cvt").map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></div>
      <div><label htmlFor="category" className="label-dark">Categoria</label><select id="category" className="input-dark" value={data.category} onChange={e=>update("category",e.target.value)}><option value="SEMINOVOS">Seminovos</option><option value="PREMIUM">Premium</option><option value="BLINDADOS">Blindados</option><option value="MOTOS">Motos</option><option value="CONSIGNACAO">Consignação</option></select></div>
      <div><label className="label-dark">Condição</label><label className="mt-2 flex gap-2 text-sm text-[#9b9ba4]"><input type="checkbox" checked={data.secondHand} onChange={e=>update("secondHand",e.target.checked)}/> Segunda mão</label></div>
    </div>
   </section>
   <section className="card-dark space-y-4 p-6"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#d4af37]">02 / Anúncio</p><h2 className="font-display text-2xl font-bold">Preço e descrição</h2>
    {input("Preço em reais (R$) *","price",{type:"number",min:1,required:true})}
    <div><label htmlFor="description" className="label-dark">Descrição * (até 255 caracteres)</label><textarea id="description" required minLength={20} maxLength={255} value={data.description} onChange={e=>update("description",e.target.value)} className="input-dark min-h-36" placeholder="Descreva o estado de conservação, revisões e detalhes do veículo." /></div>
    <div className="grid gap-4 sm:grid-cols-2">{input("Documentação informada pelo anunciante","documentation",{placeholder:"A verificar"})}{input("Garantia declarada pelo anunciante","warranty",{placeholder:"Não informada"})}{input("Laudo cautelar (informação adicional)","inspectionReport",{placeholder:"Não informado"})}</div>
    <p className="text-xs text-[#9b9ba4]">Essas informações são declarações do anunciante, não verificações oficiais. A cidade e UF informadas indicam a localização declarada do veículo, não um endereço residencial verificado.</p>
   </section>
   <section className="card-dark space-y-4 p-6"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#d4af37]">03 / Fotos</p><h2 className="font-display text-2xl font-bold">Imagens reais do veículo</h2>
    <label className="btn-outline inline-flex cursor-pointer"><input type="file" accept="image/jpeg,image/png" multiple onChange={e=>{addPhotos(e.target.files);e.target.value="";}} className="sr-only" />Selecionar fotos JPG/PNG</label>
    <p className="text-xs text-[#9b9ba4]">Até 20 fotos, 5 MB cada, enviadas somente após o anúncio ser criado. Toda alteração retorna o anúncio para análise.</p>
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">{data.images.map((url,i)=>!removed.includes(data.imageIds?.[i]??-1)&&<div key={url} className="relative"><img src={url} alt="Foto existente" className="h-24 w-full rounded-lg object-cover"/><button type="button" aria-label="Remover foto" className="absolute right-1 top-1 rounded bg-black/80 px-2 text-red-300" onClick={()=>setRemoved(r=>[...r,data.imageIds?.[i]??-1])}>×</button></div>)}{previews.map((url,i)=><div key={url} className="relative"><img src={url} alt="Prévia de foto nova" className="h-24 w-full rounded-lg object-cover"/><button type="button" aria-label="Remover prévia" className="absolute right-1 top-1 rounded bg-black/80 px-2 text-red-300" onClick={()=>setFiles(fs=>fs.filter((_,j)=>j!==i))}>×</button></div>)}</div>
   </section>
  </div>
  <aside className="h-fit space-y-4 lg:sticky lg:top-24"><div className="card-dark space-y-4 p-6"><h2 className="font-display text-xl font-bold">Revisão antes da publicação</h2><p className="text-sm leading-relaxed text-[#9b9ba4]">Seu anúncio será salvo como <strong className="text-[#f2d87e]">PENDENTE</strong>. A equipe só poderá publicá-lo depois de analisar sua identidade, a documentação do veículo e o anúncio.</p>
    {error&&<p role="alert" className="rounded-lg border border-red-500/40 bg-red-950/30 p-3 text-sm text-red-300">{error}</p>}
    <button type="submit" disabled={busy} className="btn-gold w-full">{busy?"Salvando…":mode==="edit"?"Salvar e solicitar nova análise":"Cadastrar anúncio para análise"}</button>
    <p className="text-xs text-[#777782]">Sem promessa de verificação governamental. A revisão documental é realizada por pessoas.</p></div></aside>
 </form>;
}
