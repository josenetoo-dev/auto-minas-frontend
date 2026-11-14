"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";

const KEY = "auto_minas_cookie_preferences_v1";
const CHANGE = "auto-minas-cookie-change";
const OPEN = "auto-minas-cookie-settings";
function subscribe(callback: () => void) {
  window.addEventListener(CHANGE, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE, callback);
    window.removeEventListener("storage", callback);
  };
}
function snapshot() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
function validPreference(raw: string | null | undefined) {
  try {
    const value = JSON.parse(raw || "null");
    return value?.version === 1 && value.optional === false && Number.isFinite(value.savedAt)
      && Date.now() >= value.savedAt && Date.now() - value.savedAt < 180 * 86400000;
  } catch { return false; }
}
export function CookieSettingsButton() {
  return <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN))} className="min-h-11 text-left underline underline-offset-4">Preferências de cookies</button>;
}
export default function CookiePreferences() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => undefined);
  const saved = validPreference(raw);
  const dialog = useRef<HTMLDialogElement>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const open = () => dialog.current?.showModal();
    window.addEventListener(OPEN, open);
    return () => window.removeEventListener(OPEN, open);
  }, []);
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ version: 1, necessary: true, optional: false, savedAt: Date.now() }));
      window.dispatchEvent(new Event(CHANGE));
      dialog.current?.close();
    } catch { setNotice("Seu navegador não permitiu salvar a preferência. Nenhum cookie opcional será ativado."); }
  }
  return <>
    {raw !== undefined && !saved && <section aria-label="Aviso de cookies" className="cookie-banner">
      <h2 className="text-base font-semibold text-[#f1e5ca]">Sua privacidade, sua escolha.</h2>
      <p className="mt-2 text-sm leading-6 text-[#c5c2b9]">Usamos cookies necessários para manter sua sessão. Google Analytics e cookies de publicidade não estão ativos. <Link href="/cookies" className="underline underline-offset-4">Saiba mais</Link></p>
      <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={save} className="cookie-choice">Somente necessários</button><button type="button" onClick={() => dialog.current?.showModal()} className="cookie-choice">Personalizar</button></div>
      {notice && <p role="status" className="mt-3 text-sm text-amber-200">{notice}</p>}
    </section>}
    <dialog ref={dialog} aria-labelledby="cookie-title" className="cookie-dialog">
      <div className="flex items-start justify-between gap-4"><h2 id="cookie-title" className="font-display text-2xl">Preferências de cookies</h2><button type="button" onClick={() => dialog.current?.close()} aria-label="Fechar preferências de cookies" className="min-h-11 min-w-11 rounded-lg border border-white/20">×</button></div>
      <p className="mt-4 text-sm leading-7 text-[#c5c2b9]">Você pode consultar e salvar sua preferência a qualquer momento pelo rodapé.</p>
      <div className="my-6 space-y-5"><div><h3 className="font-semibold">Necessários · sempre ativos</h3><p className="mt-2 text-sm leading-6 text-[#b7b3a9]">Sessão autenticada e armazenamento da sua preferência neste navegador.</p></div><div><h3 className="font-semibold">Opcionais · desativados</h3><p className="mt-2 text-sm leading-6 text-[#b7b3a9]">Não utilizamos análise de navegação ou publicidade nesta versão. Se forem adicionadas, as finalidades serão informadas e você poderá aceitar ou rejeitar cada categoria antes da ativação.</p></div></div>
      <div className="flex flex-wrap gap-3"><button type="button" onClick={save} className="cookie-choice">Rejeitar opcionais</button><button type="button" onClick={save} className="cookie-choice">Salvar preferências</button></div>
      {notice && <p role="status" className="mt-3 text-sm text-amber-200">{notice}</p>}
      <Link href="/cookies" className="mt-5 inline-flex min-h-11 items-center text-sm underline">Ler a política de cookies</Link>
    </dialog>
  </>;
}
