"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessageDTO, ChatSummary, ChatThread } from "@/lib/chat";
import { formatClock, formatPrice, timeAgo } from "@/lib/format";
import HistoryBackButton from "@/components/history-back-button";
import { mergeThread } from "@/lib/chat-sync";

type Props = {
  meId: number;
  initialConversations: ChatSummary[];
  initialThread: ChatThread | null;
};

type Filter = "all" | "buyer" | "seller";

function Avatar({
  name,
  url,
  className = "",
}: {
  name: string;
  url: string | null;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} referrerPolicy="no-referrer" className={`chat-ref-avatar ${className}`} />
    );
  }

  return <span className={`chat-ref-avatar chat-ref-avatar-fallback ${className}`}>{initials || "U"}</span>;
}

function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Hoje";
  if (sameDay(date, yesterday)) return "Ontem";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
}

export default function ChatApp({ meId, initialConversations, initialThread }: Props) {
  const router = useRouter();
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState<number | null>(initialThread?.conversation.id ?? null);
  const [thread, setThread] = useState<ChatThread | null>(initialThread);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<number | null>(null);
  const [clientNow, setClientNow] = useState<number | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const chatRootRef = useRef<HTMLDivElement>(null);
  const previousThreadId = useRef<number | null>(null);

  const totalUnread = conversations.reduce((sum, item) => sum + item.unread, 0);

  const visibleConversations = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");

    return conversations.filter((conversation) => {
      if (filter !== "all" && conversation.myRole !== filter) return false;
      if (!normalized) return true;

      const car = conversation.car
        ? `${conversation.car.brand} ${conversation.car.model} ${conversation.car.year}`
        : "";

      return [conversation.other.name, car, conversation.lastMessage ?? ""]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(normalized);
    });
  }, [conversations, filter, query]);

  useEffect(() => {
    const update = () => setClientNow(Date.now());
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch("/api/conversations");
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) setConversations(data.conversations);
      } catch {
        // mantém o último estado local em caso de falha temporária
      }
    };

    void tick();
    const timer = window.setInterval(tick, 12000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    let loading = false;
    let source: EventSource | null = null;

    const load = async () => {
      if (cancelled || loading || document.visibilityState !== "visible") return;
      loading = true;
      try {
        const response = await fetch(`/api/conversations/${activeId}/messages`, {cache:"no-store"});
        if (!response.ok || cancelled) return;
        const data: ChatThread = await response.json();
        if (!cancelled) setThread((current)=>mergeThread(current,data));
      } catch {
        // Mantém mensagens locais. A próxima reconexão sincroniza novamente.
      } finally {
        loading = false;
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    void load();

    // EventSource reconecta automaticamente quando perde a conexão.
    // A API só emite mudanças após commit, nunca conteúdo sem autorização.
    source = new EventSource(`/api/conversations/${activeId}/stream`);
    source.addEventListener("ready", () => void load());
    source.addEventListener("changed", () => void load());

    // Recuperação para queda de stream, deploy, clientes suspensos e mensagens legadas.
    const timer = window.setInterval(() => void load(), 12000);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      cancelled = true;
      source?.close();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [activeId]);

  useEffect(() => {
    const frame = chatRootRef.current;
    const viewport = window.visualViewport;
    if (!activeId || !frame || !viewport) return;

    const sync = () => {
      const unzoomed = viewport.scale === 1;
      frame.style.setProperty("--chat-visual-height", unzoomed ? `${viewport.height}px` : "100dvh");
      frame.style.setProperty("--chat-visual-top", unzoomed ? `${viewport.offsetTop}px` : "0px");
      const focused = document.activeElement;
      const typing = frame.contains(focused) && (focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement);
      frame.toggleAttribute("data-keyboard-open", unzoomed && typing && window.innerHeight - viewport.height > 120);
    };
    sync();
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
      frame.style.removeProperty("--chat-visual-height");
      frame.style.removeProperty("--chat-visual-top");
      frame.removeAttribute("data-keyboard-open");
    };
  }, [activeId]);

  useEffect(() => {
    if (!thread || thread.conversation.id !== activeId) return;

    const unreadMessages = thread.messages
      .filter((message) => message.senderId !== meId && !message.readAt && !message.deleted && message.id > 0);

    const markVisible = () => {
      if (document.visibilityState !== "visible" || !document.hasFocus() || unreadMessages.length === 0) return;

      const groups = new Map<number, number[]>();
      for (const message of unreadMessages) {
        const proposalId = message.proposalId ?? activeId!;
        groups.set(proposalId, [...(groups.get(proposalId) ?? []), message.id]);
      }

      for (const [proposalId, ids] of groups) {
        void fetch(`/api/backend/v1/proposta/${proposalId}/mensagens/leitura`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: ids.slice(0, 200) }),
        }).catch(() => {});
      }
    };

    markVisible();
    document.addEventListener("visibilitychange", markVisible);
    window.addEventListener("focus", markVisible);

    return () => {
      document.removeEventListener("visibilitychange", markVisible);
      window.removeEventListener("focus", markVisible);
    };
  }, [thread, activeId, meId]);

  useEffect(() => {
    const node = messagesRef.current;
    if (!node) return;
    const switched = previousThreadId.current !== activeId;
    previousThreadId.current = activeId;
    const nearBottom = node.scrollHeight-node.scrollTop-node.clientHeight < 250;
    if (switched || nearBottom) node.scrollTop = node.scrollHeight;
  }, [thread?.messages.length, activeId]);

  function openConversation(id: number) {
    setActiveId(id);
    setThread(null);
    setSendError(null);
    router.push(`/chat/${id}`);
  }

  function quickMessage(message: string) {
    setInput(message);
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const content = input.trim();

    if ((!content && !selectedFile) || !activeId || sending) return;

    setSending(true);
    setSendError(null);

    const tempId = -Date.now();
    const temp: ChatMessageDTO = {
      id: tempId,
      pending: true,
      senderId: meId,
      content: selectedFile ? `Imagem: ${selectedFile.name}` : content,
      createdAt: new Date().toISOString(),
      readAt: null,
    };

    setThread((current) => current ? { ...current, messages: [...current.messages, temp] } : current);
    if (!selectedFile) setInput("");

    try {
      let response: Response;

      if (selectedFile) {
        const form = new FormData();
        form.set("file", selectedFile);
        response = await fetch(`/api/conversations/${activeId}/attachments`, { method: "POST", body: form });
      } else {
        response = await fetch(`/api/conversations/${activeId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
      }

      const data = await response.json().catch(() => ({
        error: response.status === 413
          ? "A imagem excedeu o limite. Escolha JPEG ou PNG de até 4 MiB."
          : "Não foi possível ler a resposta do servidor.",
      }));

      if (!response.ok) throw new Error(data.error ?? "Não foi possível enviar a mensagem.");

      setThread((current) =>
        current
          ? {
              ...current,
              messages: [
                ...current.messages.filter((message)=>message.id!==tempId && message.id!==data.message.id),
                { ...data.message, pending:false, failed:false },
              ].sort((a,b)=>new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime()),
            }
          : current,
      );

      setSelectedFile(null);
      setInput("");
    } catch (cause) {
      setThread((current) =>
        current ? { ...current, messages: current.messages.map((message) =>
          message.id === tempId ? {...message,pending:false,failed:true} : message
        ) } : current,
      );
      if (content) setInput(content);
      setSendError(cause instanceof Error ? cause.message : "Falha de conexão. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  async function deleteMessage(messageId: number, proposalId?: number) {
    if (!activeId || deletingMessage !== null) return;

    setDeletingMessage(messageId);
    setSendError(null);

    try {
      const response = await fetch(
        `/api/conversations/${proposalId ?? activeId}/messages?messageId=${messageId}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Não foi possível excluir a mensagem.");
      }

      setThread((current) =>
        current
          ? { ...current, messages: current.messages.filter((message) => message.id !== messageId) }
          : current,
      );
    } catch (cause) {
      setSendError(cause instanceof Error ? cause.message : "Falha ao excluir a mensagem.");
    } finally {
      setDeletingMessage(null);
    }
  }

  const car = thread?.car;
  const other = thread?.other;
  const myRole = thread?.conversation.myRole;

  return (
    <div ref={chatRootRef} className={`chat-reference-screen ${activeId ? "has-thread" : "is-list"}`}>
      <aside className={`chat-reference-list ${activeId ? "is-hidden-mobile" : ""}`}>
        <header className="chat-reference-brandbar">
          <Link href="/" className="chat-reference-brand">
            <span>AM</span>
            <strong>Auto Minas</strong>
          </Link>
          {totalUnread > 0 && <span className="chat-reference-unread-total">{totalUnread > 99 ? "99+" : totalUnread}</span>}
        </header>

        <section className="chat-reference-list-hero">
          <div>
            <h1>Conversas</h1>
            <p>Negocie, tire dúvidas e acompanhe seus interesses.</p>
          </div>
          <div className="chat-reference-list-car" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/vehicle-illustration.svg" alt="" />
          </div>
        </section>

        <div className="chat-reference-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar conversa..." />
        </div>

        <nav className="chat-reference-filters" aria-label="Filtrar conversas">
          <button type="button" className={filter === "all" ? "is-active" : ""} onClick={() => setFilter("all")}>Todas</button>
          <button type="button" className={filter === "buyer" ? "is-active" : ""} onClick={() => setFilter("buyer")}>Compras</button>
          <button type="button" className={filter === "seller" ? "is-active" : ""} onClick={() => setFilter("seller")}>Vendas</button>
        </nav>

        <div className="chat-reference-conversation-list">
          {visibleConversations.length === 0 && (
            <div className="chat-reference-empty">
              <p>{conversations.length === 0 ? "Nenhuma conversa ainda." : "Nenhuma conversa encontrada."}</p>
              {conversations.length === 0 && <Link href="/carros">Ver veículos</Link>}
            </div>
          )}

          {visibleConversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              className={`chat-reference-conversation ${activeId === conversation.id ? "is-active" : ""}`}
              onClick={() => openConversation(conversation.id)}
            >
              <div className="chat-reference-car-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={conversation.car?.image ?? "/images/car-placeholder.svg"}
                  alt={conversation.car ? `${conversation.car.brand} ${conversation.car.model}` : "Veículo"}
                />
              </div>

              <div className="chat-reference-conversation-copy">
                <div className="chat-reference-conversation-title">
                  <strong>{conversation.other.name}</strong>
                  <span className={conversation.myRole === "seller" ? "is-sale" : "is-buy"}>
                    {conversation.myRole === "seller" ? "Venda" : "Compra"}
                  </span>
                  <time>{timeAgo(conversation.lastAt)}</time>
                </div>

                <p className="chat-reference-car-name">
                  {conversation.car
                    ? `${conversation.car.brand} ${conversation.car.model} ${conversation.car.year}`
                    : "Anúncio indisponível"}
                </p>

                <div className="chat-reference-last-row">
                  <p>{conversation.lastMessage ?? "Comece a conversa."}</p>
                  {conversation.unread > 0 && <span>{conversation.unread > 9 ? "9+" : conversation.unread}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className={`chat-reference-thread ${activeId ? "" : "is-hidden-mobile"}`}>
        {thread && other ? (
          <>
            <header className="chat-thread-header">
              <HistoryBackButton fallback="/chat" className="chat-thread-back">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
              </HistoryBackButton>

              <Avatar name={other.name} url={other.avatarUrl} className="chat-thread-avatar" />

              <div className="chat-thread-person">
                <strong>{other.name}</strong>
                <span>{myRole === "seller" ? "Conversa com comprador" : "Conversa com vendedor"}</span>
              </div>

              <Link href={`/perfil/${other.id}`} className="chat-thread-profile-link" aria-label="Ver perfil">
                ⋮
              </Link>
            </header>

            {car && (
              <Link href={`/carros/${car.id}`} className="chat-thread-car-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={car.image ?? "/images/car-placeholder.svg"} alt={`${car.brand} ${car.model}`} />
                <span>
                  <strong>{car.brand} {car.model} {car.year}</strong>
                  <b>{formatPrice(car.price)}</b>
                </span>
                <em>›</em>
              </Link>
            )}

            <aside className="mx-3 my-2 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-xs leading-5 text-[#e6d5aa] sm:mx-5" aria-label="Cuidados contra golpes">
              Confirme a identidade de quem negocia. Desconfie de intermediários e mudanças de interlocutor; não transfira dinheiro antecipadamente a terceiros. Confira titularidade e documentos presencialmente. <Link href="/seguranca/encontro" className="underline">Checklist de encontro seguro</Link>.
            </aside>

            <div ref={messagesRef} className="chat-thread-messages">
              <aside className="mx-1 mb-3 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-xs leading-5 text-[#e6d5aa]" aria-label="Cuidados contra golpes">
                Confirme a identidade de quem negocia. Desconfie de intermediários e mudanças de interlocutor; não transfira dinheiro antecipadamente a terceiros. Confira titularidade e documentos presencialmente. <Link href="/seguranca/encontro" className="underline">Checklist de encontro seguro</Link>.
              </aside>
              {thread.messages.length === 0 && (
                <div className="chat-thread-empty">
                  Diga olá para <strong>{other.name}</strong> e comece a negociar.
                </div>
              )}

              {thread.messages.map((message, index) => {
                const mine = message.senderId === meId;
                const previous = thread.messages[index - 1];
                const showDay = !previous || dayLabel(previous.createdAt) !== dayLabel(message.createdAt);

                return (
                  <div key={message.id}>
                    {showDay && <div className="chat-thread-day">{dayLabel(message.createdAt)}</div>}

                    <div className={`chat-thread-message-row ${mine ? "is-mine" : "is-other"}`}>
                      {!mine && <Avatar name={other.name} url={other.avatarUrl} className="chat-message-avatar" />}

                      <div className="chat-thread-message-wrap">
                        <div className={`chat-thread-bubble ${message.pending ? "is-pending" : ""} ${message.failed ? "is-failed" : ""}`}>
                          {message.attachment && !message.deleted && (
                            <a href={message.attachment.url} download className="chat-thread-attachment">
                              Imagem · {message.attachment.name}
                            </a>
                          )}
                          <p>{message.deleted ? "Mensagem excluída" : message.content}</p>
                          <span>
                            {formatClock(message.createdAt)}
                            {mine && message.id > 0 && <b>{message.readAt ? "✓✓" : "✓"}</b>}
                            {mine && message.pending && <b>Enviando…</b>}
                            {mine && message.failed && <b>Falha</b>}
                          </span>
                        </div>

                        {mine && message.failed && (
                          <button type="button" className="chat-thread-send-status is-failed" onClick={() => {
                            setThread((current)=>current
                              ? {...current,messages:current.messages.filter((item)=>item.id!==message.id)}
                              : current);
                            if (message.content && !message.content.startsWith("Imagem:")) setInput(message.content);
                          }}>
                            Reenviar mensagem
                          </button>
                        )}
                        {mine &&
                          message.id > 0 &&
                          !message.deleted &&
                          clientNow !== null &&
                          clientNow - new Date(message.createdAt).getTime() <= 5 * 60 * 1000 && (
                            <button
                              type="button"
                              className="chat-thread-delete"
                              disabled={deletingMessage !== null}
                              onClick={() => void deleteMessage(message.id, message.proposalId)}
                            >
                              {deletingMessage === message.id ? "Excluindo…" : "Excluir"}
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}

            </div>

            <div className="chat-thread-quick-actions">
              <button type="button" onClick={() => quickMessage("Podemos agendar uma visita para eu ver o veículo?")}>Agendar visita</button>
              <button type="button" onClick={() => quickMessage("Gostaria de conversar sobre o valor da proposta.")}>Negociar valor</button>
              <button type="button" onClick={() => quickMessage("Pode me enviar mais fotos do veículo?")}>Solicitar fotos</button>
            </div>

            {selectedFile && (
              <div className="chat-thread-selected-file">
                <span>{selectedFile.name}</span>
                <button type="button" onClick={() => setSelectedFile(null)}>Remover</button>
              </div>
            )}

            <form className="chat-thread-composer" onSubmit={send}>
              {sendError && <p className="chat-thread-error" role="alert">{sendError}</p>}
              <div>
                <label className="chat-thread-attach" aria-label="Anexar imagem">
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (!["image/jpeg", "image/png"].includes(file.type)) {
                        setSendError("Escolha uma imagem JPEG ou PNG.");
                        return;
                      }
                      if (file.size > 4 * 1024 * 1024) {
                        setSendError("A imagem deve ter no máximo 4 MiB.");
                        return;
                      }
                      setSelectedFile(file);
                      setSendError(null);
                      event.target.value = "";
                    }}
                  />
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 12 5-5a3 3 0 0 1 4 4l-7 7a5 5 0 0 1-7-7l8-8" /></svg>
                </label>

                <textarea
                  rows={1}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void send(event as unknown as React.FormEvent);
                    }
                  }}
                  placeholder="Digite uma mensagem..."
                  aria-label="Mensagem"
                />

                <button type="button" className="chat-thread-emoji" onClick={() => setInput((value) => value + " 🙂")} aria-label="Adicionar emoji">
                  ☺
                </button>
              </div>

              <button type="submit" className="chat-thread-send" disabled={sending || (!input.trim() && !selectedFile)} aria-label="Enviar mensagem">
                {sending ? "…" : "➤"}
              </button>
            </form>
          </>
        ) : (
          <div className="chat-thread-placeholder">
            <h2>Selecione uma conversa</h2>
            <p>Escolha uma negociação para continuar.</p>
          </div>
        )}
      </section>
    </div>
  );
}
