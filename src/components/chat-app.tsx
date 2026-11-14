"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ChatMessageDTO, ChatSummary, ChatThread } from "@/lib/chat";
import { formatClock, formatPrice, timeAgo } from "@/lib/format";

type Props = {
  meId: number;
  initialConversations: ChatSummary[];
  initialThread: ChatThread | null;
};

function Avatar({ name, url, className = "h-10 w-10" }: { name: string; url: string | null; className?: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} referrerPolicy="no-referrer" className={`${className} shrink-0 rounded-full object-cover ring-1 ring-[#d4af37]/50`} />;
  }
  return (
    <span className={`${className} grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#f2d87e] to-[#a8842a] text-sm font-bold text-[#171003]`}>
      {initials || "U"}
    </span>
  );
}

export default function ChatApp({ meId, initialConversations, initialThread }: Props) {
  const [conversations, setConversations] = useState<ChatSummary[]>(initialConversations);
  const [activeId, setActiveId] = useState<number | null>(initialThread?.conversation.id ?? null);
  const [thread, setThread] = useState<ChatThread | null>(initialThread);
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<number | null>(null);
  const [clientNow, setClientNow] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const resize = () => {
      const top = workspace.getBoundingClientRect().top + window.scrollY;
      workspace.style.height = `${Math.max(300, window.innerHeight - top)}px`;
    };
    const observer = new ResizeObserver(resize);
    const main = workspace.closest("main");
    if (main) {
      let sibling = main.previousElementSibling;
      while (sibling) { observer.observe(sibling); sibling = sibling.previousElementSibling; }
    }
    window.addEventListener("resize", resize);
    resize();
    return () => { observer.disconnect(); window.removeEventListener("resize", resize); };
  }, []);

  useEffect(() => {
    const update = () => setClientNow(Date.now());
    update();
    const timer = setInterval(update, 30_000);
    return () => clearInterval(timer);
  }, []);

  // Poll da lista de conversas (badges de não lidas + novas conversas)
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/conversations");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setConversations(data.conversations);
        }
      } catch {
        /* offline */
      }
    };
    tick();
    const timer = setInterval(tick, 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // Poll da conversa ativa
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/conversations/${activeId}/messages`);
        if (!res.ok || cancelled) return;
        const data: ChatThread = await res.json();
        setThread(data);
      } catch {
        /* offline */
      }
    };
    load();
    const timer = setInterval(load, 2500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [activeId, meId]);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto", block: "nearest" });
  }, [thread?.messages.length, activeId]);

  function openConversation(id: number) {
    setActiveId(id);
    setThread(null);
    setSendError(null);
    window.history.replaceState(null, "", `/chat/${id}`);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if ((!content && !selectedFile) || !activeId || sending) return;
    setSending(true);
    setSendError(null);
    const tempId = -Date.now();
    const temp: ChatMessageDTO = { id: tempId, senderId: meId, content: selectedFile ? `Imagem: ${selectedFile.name}` : content, createdAt: new Date().toISOString(), readAt: null };
    setThread((prev) => (prev ? { ...prev, messages: [...prev.messages, temp] } : prev));
    if (!selectedFile) setInput("");
    try {
      let res:Response;
      if(selectedFile){const form=new FormData();form.set("file",selectedFile);res=await fetch(`/api/conversations/${activeId}/attachments`,{method:"POST",body:form});}
      else res = await fetch(`/api/conversations/${activeId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
      const data = await res.json().catch(() => ({ error: res.status === 413 ? "A imagem excedeu o limite. Escolha JPEG ou PNG de até 4 MiB." : "Não foi possível ler a resposta do servidor." }));
      if (res.ok) {
        setThread((prev) =>
          prev
            ? { ...prev, messages: prev.messages.map((m) => (m.id === tempId ? (data.message.attachment ? data.message : { ...data.message, attachment: undefined }) : m)) }
            : prev,
        );
        setSelectedFile(null);
      } else {
        setThread((prev) =>
          prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== tempId) } : prev,
        );
        if(content)setInput(content);
        setSendError(data.error ?? "Não foi possível enviar a mensagem.");
      }
    } catch {
      setThread((prev) =>
        prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== tempId) } : prev,
      );
      if(content)setInput(content);
      setSendError("Falha de conexão. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  async function deleteMessage(messageId:number) {
    if(!activeId||deletingMessage!==null)return;
    setDeletingMessage(messageId);setSendError(null);
    try {
      const response=await fetch(`/api/conversations/${activeId}/messages?messageId=${messageId}`,{method:"DELETE"});
      if(!response.ok){const body=await response.json().catch(()=>({}));throw new Error(body.error??"Não foi possível excluir a mensagem.");}
      setThread(current=>current?{...current,messages:current.messages.filter(message=>message.id!==messageId)}:current);
    } catch(error) { setSendError(error instanceof Error?error.message:"Falha ao excluir a mensagem."); }
    finally { setDeletingMessage(null); }
  }

  const car = thread?.car;
  const other = thread?.other;
  const myRole = thread?.conversation.myRole;

  return (
    <div ref={workspaceRef} className="mx-auto flex h-[calc(100dvh-4rem)] min-h-[300px] max-w-7xl flex-col sm:max-h-[780px] sm:px-4 sm:py-4">
      <div className="card-dark grid min-h-0 min-w-0 flex-1 overflow-hidden md:grid-cols-[minmax(245px,310px)_minmax(0,1fr)] lg:grid-cols-[330px_minmax(0,1fr)]">
        {/* Lista de conversas */}
        <aside className={`${activeId ? "hidden md:flex" : "flex"} min-h-0 min-w-0 flex-col border-r border-[#26262e]`}>
          <div className="border-b border-[#26262e] px-5 py-4">
            <h1 className="font-display text-lg font-bold text-[#f4f3ee]">
              Negociações <span className="gold-text">do Auto Minas</span>
            </h1>
            <p className="mt-0.5 text-xs text-[#9b9ba4]">
              {conversations.length === 0
                ? "Suas propostas e mensagens aparecem aqui"
                : `${conversations.length} conversa${conversations.length > 1 ? "s" : ""}`}
            </p>
          </div>

          <div className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {conversations.length === 0 && (
              <div className="px-5 py-10 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#d4af37]/10">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#d4af37]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-semibold text-[#f4f3ee]">Nenhuma conversa ainda</p>
                <p className="mt-1 text-xs leading-relaxed text-[#9b9ba4]">
                  Encontre um carro e toque em “Conversar com o vendedor” para começar a negociar.
                </p>
                <Link href="/carros" className="btn-gold mt-5 px-5 py-2.5 text-sm">
                  Ver carros à venda
                </Link>
              </div>
            )}

            {conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => openConversation(conv.id)}
                className={`flex w-full items-start gap-3 border-b border-[#1c1c22] px-4 py-4 text-left transition-colors ${
                  activeId === conv.id ? "bg-[#d4af37]/10" : "hover:bg-white/[0.03]"
                }`}
              >
                <Avatar name={conv.other.name} url={conv.other.avatarUrl} className="h-11 w-11" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-[#f4f3ee]">
                      {conv.other.name}
                    </p>
                    <span className="shrink-0 text-[10px] text-[#a5a5ad]">
                      {timeAgo(conv.lastAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[#9b9ba4]">
                    {conv.car ? `${conv.car.brand} ${conv.car.model} ${conv.car.year}` : "Anúncio removido"}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-[#9b9ba4]">
                      {conv.lastMessage ?? "Comece a conversa 👋"}
                    </p>
                    {conv.unread > 0 && (
                      <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#f2d87e] to-[#b08d24] px-1.5 text-[10px] font-bold text-[#171003]">
                        {conv.unread > 9 ? "9+" : conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Janela da conversa */}
        <section className={`${activeId ? "flex" : "hidden md:flex"} min-h-0 min-w-0 flex-col`}>
          {thread && other ? (
            <>
              {/* Cabeçalho da thread */}
              <div className="flex min-w-0 items-center gap-2 border-b border-[#26262e] px-3 py-3 sm:gap-3 sm:px-4">
                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-[#26262e] text-[#9b9ba4] hover:text-[#f4f3ee] md:hidden"
                  aria-label="Voltar"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M11 18l-6-6 6-6" />
                  </svg>
                </button>
                <Avatar name={other.name} url={other.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#f4f3ee]">{other.name}</p>
                  <p className="truncate text-xs text-[#9b9ba4]">
                    {myRole === "seller" ? "Você está vendendo este carro" : "Você está comprando este carro"}
                  </p>
                </div>
                {car && (
                  <Link
                    href={`/carros/${car.id}`}
                    className="hidden items-center gap-2.5 rounded-xl border border-[#26262e] bg-[#101014] p-1.5 pr-4 transition-colors hover:border-[#d4af37]/60 sm:flex"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={car.image ?? "/images/car-placeholder.svg"}
                      alt={`${car.brand} ${car.model}`}
                      className="h-10 w-14 rounded-lg object-cover"
                    />
                    <span className="text-left">
                      <span className="block text-xs font-semibold text-[#f4f3ee]">
                        {car.brand} {car.model} {car.year}
                      </span>
                      <span className="gold-text block text-xs font-bold">
                        {formatPrice(car.price)}
                      </span>
                    </span>
                  </Link>
                )}
              </div>

              {/* Mensagens */}
              <div className="nice-scroll min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[#0b0b0e] px-3 py-4 sm:px-4 sm:py-5">
                {thread.messages.length === 0 && (
                  <div className="py-10 text-center">
                    <p className="text-sm text-[#9b9ba4]">
                      Diga olá para <span className="font-bold text-[#f2d87e]">{other.name}</span> e comece a negociar 👋
                    </p>
                  </div>
                )}
                {thread.messages.map((m) => {
                  const mine = m.senderId === meId;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[88%] min-w-0 sm:max-w-[70%] lg:max-w-[65%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            mine
                              ? "rounded-br-sm bg-gradient-to-br from-[#e9cf7c] to-[#c39a2e] text-[#171003] shadow-[0_4px_18px_-6px_rgba(212,175,55,0.5)]"
                              : "rounded-bl-sm border border-[#26262e] bg-[#1a1a21] text-[#ecece6]"
                          }`}
                        >
                          {m.attachment && !m.deleted && <a href={m.attachment.url} download className="mb-1 block rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold underline underline-offset-4">Baixar imagem · {m.attachment.name} ({Math.ceil(m.attachment.size/1024)} KB)</a>}
                          <p className="whitespace-pre-wrap break-words">{m.deleted ? "Mensagem excluída" : m.content}</p>
                        </div>
                        <p className={`mt-1 flex items-center gap-1 px-1 text-[10px] text-[#a5a5ad]`}>
                          {formatClock(m.createdAt)}
                          {mine && m.id > 0 && (
                            <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${m.readAt ? "text-[#d4af37]" : "text-[#a5a5ad]"}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 12.5l5 5L13 9M13 9l3.5 3.5L22 7" />
                            </svg>
                          )}
                        </p>
                        {mine && m.id > 0 && !m.deleted && clientNow !== null && clientNow-new Date(m.createdAt).getTime()<=5*60*1000 && <button type="button" disabled={deletingMessage!==null} onClick={()=>void deleteMessage(m.id)} className="mt-1 min-h-8 px-1 text-[11px] text-[#d4af37] underline disabled:opacity-50">{deletingMessage===m.id?"Excluindo…":"Excluir mensagem"}</button>}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {selectedFile && <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-2 text-xs text-[#c5c2b9]"><span className="truncate">Imagem selecionada: {selectedFile.name}. O texto será enviado separadamente.</span><button type="button" onClick={()=>setSelectedFile(null)} className="min-h-11 shrink-0 underline">Remover imagem</button></div>}
              {/* Input */}
              <form onSubmit={send} className="shrink-0 border-t border-[#26262e] bg-[#0e0e12] px-2.5 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:p-3">
                {sendError && <p role="alert" className="mb-2 px-1 text-xs text-red-300">{sendError}</p>}
                <div className="flex items-end gap-2">
                  <label className="grid h-11 w-11 shrink-0 cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#f2d87e] place-items-center rounded-xl border border-[#26262e] text-[#d4af37] hover:border-[#d4af37]/60" aria-label="Anexar imagem">
                    <input type="file" aria-label="Selecionar imagem para enviar" accept="image/jpeg,image/png" className="sr-only" onChange={event=>{const file=event.target.files?.[0];if(!file)return;if(!["image/jpeg","image/png"].includes(file.type)){setSelectedFile(null);setSendError("Escolha uma imagem JPEG ou PNG.");return;}if(file.size>4*1024*1024){setSelectedFile(null);setSendError("A imagem deve ter no máximo 4 MiB.");return;}setSelectedFile(file);setSendError("");event.target.value="";}} />
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                  </label>
                  <textarea
                    aria-label="Mensagem para negociação"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send(e as unknown as React.FormEvent);
                      }
                    }}
                    rows={1}
                    placeholder="Escreva sua mensagem…"
                    className="input-dark max-h-32 min-h-[44px] min-w-0 flex-1 resize-none py-3"
                  />
                  <button
                    type="submit"
                    disabled={sending || (!input.trim() && !selectedFile)}
                    className="btn-gold h-11 w-11 shrink-0 !rounded-xl !p-0"
                    aria-label="Enviar mensagem"
                  >
                    {sending ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#171003]/30 border-t-[#171003]" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center px-6">
              <div className="text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#d4af37]/10">
                  <svg viewBox="0 0 24 24" className="h-8 w-8 text-[#d4af37]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
                  </svg>
                </div>
                <h2 className="font-display mt-5 text-xl font-bold text-[#f4f3ee]">
                  Selecione uma conversa
                </h2>
                <p className="mt-2 max-w-xs text-sm text-[#9b9ba4]">
                  Escolha uma negociação ao lado para ver as mensagens trocadas com o vendedor.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
