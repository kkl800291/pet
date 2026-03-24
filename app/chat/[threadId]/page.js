import { notFound, redirect } from 'next/navigation';
import { AppShell } from '../../../components/app-shell.js';
import { ChatBox } from '../../../components/chat-box.js';
import { getCurrentOwner } from '../../../lib/auth.js';
import { getState } from '../../../lib/state.js';

export default async function ChatPage({ params }) {
  const owner = await getCurrentOwner();
  if (!owner) redirect('/login');

  const state = await getState();
  const chat = state.chats.find((item) => item.id === params.threadId);
  if (!chat) notFound();

  return (
    <AppShell title="私聊" subtitle="互相关注后开放的实时对话能力。">
      <ChatBox threadId={chat.id} ownerId={owner.id} initialMessages={chat.messages} />
    </AppShell>
  );
}
