import type { ChatThread } from "@/lib/chat";

/** Reconcilia o histórico persistido com mensagens otimistas ainda locais. */
export function mergeThread(previous:ChatThread | null, incoming:ChatThread):ChatThread {
  if (!previous || previous.conversation.id !== incoming.conversation.id) return incoming;
  const ids=new Set(incoming.messages.map((item)=>item.id));
  const local=previous.messages.filter((item)=>item.id<0 && !ids.has(item.id));
  return {
    ...incoming,
    messages:[...incoming.messages,...local].sort((a,b)=>{
      const delta=new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime();
      return delta || a.id-b.id;
    }),
  };
}
