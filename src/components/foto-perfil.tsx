"use client";

import Link from "next/link";
import {useState, type FormEvent} from "react";

export default function FotoPerfil({userId}:{userId:number}) {
 const [busy,setBusy]=useState(false), [status,setStatus]=useState("");
 async function save(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const form = event.currentTarget;
  const body = new FormData(form);
  const file = body.get("arquivo");
  if (!(file instanceof File) || !file.size || file.size > 4*1024*1024) {
   setStatus("Selecione uma foto JPG ou PNG de até 4 MiB."); return;
  }
  setBusy(true); setStatus("");
  try {
   const response=await fetch("/api/backend/v1/usuario/me/foto-perfil",{method:"POST",body});
   if(!response.ok) {
    const data=await response.json().catch(()=>({}));
    throw new Error(data.detail||data.error||"Falha ao salvar. Tente outra imagem.");
   }
   form.reset(); setStatus("Foto pública atualizada.");
  } catch(error){setStatus(error instanceof Error?error.message:"Falha de conexão.");}
  finally{setBusy(false);}
 }
 return <form className="mt-5 space-y-3 border-t border-white/10 pt-4" onSubmit={save}>
  <label className="block text-sm">Foto pública do perfil
   <input className="mt-2 block max-w-full text-xs" type="file" accept="image/jpeg,image/png" name="arquivo" required/>
  </label>
  <p className="text-xs text-[#bdb8ae]">Use uma foto sua. Ela ficará visível no perfil e compõe os requisitos do nível 1.</p>
  <button disabled={busy} className="btn-outline">{busy?"Salvando…":"Salvar foto"}</button>
  <Link className="ml-3 underline" href={`/perfil/${userId}`}>Ver meu perfil</Link>
  <p role="status" className="text-sm">{status}</p>
 </form>;
}
