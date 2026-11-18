"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props={
  userId:number;
  initialName:string;
  email:string;
  initialPhone:string;
  cpfMasked:string|null;
  hasPhoto:boolean;
};

export default function ProfileEditForm({userId,initialName,email,initialPhone,cpfMasked,hasPhoto}:Props) {
  const router=useRouter();
  const inputRef=useRef<HTMLInputElement>(null);
  const [name,setName]=useState(initialName);
  const [phone,setPhone]=useState(initialPhone);
  const [photo,setPhoto]=useState<File|null>(null);
  const [preview,setPreview]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  useEffect(()=>{
    let canceled=false;
    if(!photo){
      queueMicrotask(()=>{if(!canceled)setPreview(null);});
      return()=>{canceled=true;};
    }
    const url=URL.createObjectURL(photo);
    queueMicrotask(()=>{if(!canceled)setPreview(url);});
    return()=>{
      canceled=true;
      URL.revokeObjectURL(url);
    };
  },[photo]);

  async function save(event:React.FormEvent) {
    event.preventDefault();
    setBusy(true);setMessage("");setError("");
    try {
      const digits=phone.replace(/\D/g,"");
      if(digits.length<10||digits.length>11) throw new Error("Informe um telefone válido com DDD.");

      const response=await fetch(`/api/backend/v1/usuario/${userId}`,{
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({nome:name.trim(),email,telefone:digits}),
      });
      const body=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(body.detail||body.error||"Não foi possível salvar seus dados.");

      if(photo) {
        if(!["image/jpeg","image/png"].includes(photo.type)||!photo.size||photo.size>4*1024*1024) {
          throw new Error("Os dados foram salvos, mas a foto deve ser JPG ou PNG de até 4 MiB.");
        }
        const data=new FormData();
        data.append("arquivo",photo);
        const upload=await fetch("/api/backend/v1/usuario/me/foto-perfil",{method:"POST",body:data});
        if(!upload.ok) {
          const uploadBody=await upload.json().catch(()=>({}));
          throw new Error(uploadBody.detail||uploadBody.error||"Os dados foram salvos, mas a foto não pôde ser atualizada.");
        }
      }

      setPhoto(null);
      setMessage("Perfil atualizado.");
      router.refresh();
    } catch(cause) {
      setError(cause instanceof Error?cause.message:"Falha de conexão.");
    } finally {
      setBusy(false);
    }
  }

  const photoSrc=preview || (hasPhoto ? `/perfil/${userId}/foto` : null);

  return (
    <form className="profile-edit-reference-form" onSubmit={save}>
      <div className="profile-edit-avatar-wrap">
        <button type="button" className="profile-edit-avatar" onClick={()=>inputRef.current?.click()} aria-label="Alterar foto do perfil">
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoSrc} alt="Foto do perfil"/>
          ) : (
            <span className="profile-avatar-placeholder" aria-hidden="true">●</span>
          )}
          <i aria-hidden="true">▣</i>
        </button>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png"
          onChange={event=>setPhoto(event.target.files?.[0]??null)}
        />
        <small>Toque na foto para alterar</small>
      </div>

      <label className="profile-edit-field">
        <span>Nome completo</span>
        <div><b aria-hidden="true">♙</b><input value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={120} required /></div>
      </label>

      <label className="profile-edit-field">
        <span>E-mail</span>
        <div className="is-readonly"><b aria-hidden="true">✉</b><input value={email} readOnly /></div>
        <small>A troca de e-mail exige confirmação específica por segurança.</small>
      </label>

      <label className="profile-edit-field">
        <span>Telefone</span>
        <div><b aria-hidden="true">☎</b><input value={phone} onChange={e=>setPhone(e.target.value)} required inputMode="tel" /></div>
      </label>

      <label className="profile-edit-field">
        <span>CPF</span>
        <div className="is-readonly"><b aria-hidden="true">▤</b><input value={cpfMasked||"Não informado"} readOnly /></div>
        <small>Identidade é gerenciada no fluxo de verificação, não neste formulário.</small>
      </label>

      {message&&<p className="profile-edit-success" role="status">{message}</p>}
      {error&&<p className="profile-edit-error" role="alert">{error}</p>}

      <button type="submit" className="profile-edit-submit" disabled={busy||!name.trim()}>
        {busy?"Salvando…":"Salvar alterações"} <span aria-hidden="true">✓</span>
      </button>
    </form>
  );
}
