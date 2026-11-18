import type { ChatThread } from "@/lib/chat";

/** Reconcilia o histórico persistido com mensagens otimistas ainda locais. */
export function mergeThread(previous:ChatThread | null, incoming:ChatThread):ChatThread {
  if (!previous || previous.conversation.id !== incoming.conversation.id) return incoming;
  const ids=new Set(incoming.messages.map((item)=>item.id));
  const alreadyShown=new Set(previous.messages.filter((item)=>item.id>0).map((item)=>item.id));
  const local=previous.messages.filter((item)=>{
    if(item.id>=0 || ids.has(item.id)) return false;
    const confirmed=incoming.messages.some((server)=>{
      if(server.senderId!==item.senderId || alreadyShown.has(server.id)) return false;
      const difference=Math.abs(new Date(server.createdAt).getTime()-new Date(item.createdAt).getTime());
      return difference <= 15000 && (
        server.content===item.content
        || (item.content?.startsWith("Imagem:") && !!server.attachment)
      );
    });
    return !confirmed;
  });
  return {
    ...incoming,
    messages:[...incoming.messages,...local].sort((a,b)=>{
      const delta=new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime();
      return delta || a.id-b.id;
    }),
  };
}
