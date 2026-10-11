import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ChatApp from "@/components/chat-app";
import { getChatThread, getConversationSummaries } from "@/lib/chat";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Conversa",
};

export default async function ChatConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const conversationId = parseInt(id, 10);

  if (!Number.isFinite(conversationId)) notFound();

  const [thread, conversations] = await Promise.all([
    getChatThread(user.id, conversationId),
    getConversationSummaries(user.id),
  ]);

  if (!thread) notFound();

  return (
    <ChatApp
      meId={user.id}
      initialConversations={conversations}
      initialThread={thread}
    />
  );
}
