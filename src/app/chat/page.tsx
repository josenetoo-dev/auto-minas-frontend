import type { Metadata } from "next";
import ChatApp from "@/components/chat-app";
import { getConversationSummaries } from "@/lib/chat";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chat",
  description: "Converse diretamente com compradores e vendedores no chat da Auto Minas.",
};

export default async function ChatPage() {
  const user = await requireUser();
  const conversations = await getConversationSummaries(user.id);

  return (
    <ChatApp
      meId={user.id}
      initialConversations={conversations}
      initialThread={null}
    />
  );
}
