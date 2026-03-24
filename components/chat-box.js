"use client";

import { useEffect, useMemo, useRef, useState } from 'react';

export function ChatBox({ threadId, ownerId, initialMessages }) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('connecting');
  const wsRef = useRef(null);

  useEffect(() => {
    const socket = new WebSocket(`${location.origin.replace('http', 'ws')}/ws?threadId=${encodeURIComponent(threadId)}&ownerId=${encodeURIComponent(ownerId)}`);
    wsRef.current = socket;
    socket.onopen = () => setStatus('online');
    socket.onclose = () => setStatus('offline');
    socket.onerror = () => setStatus('offline');
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_update' && data.threadId === threadId) {
          setMessages((current) =>
            current.some((item) => item.id === data.message?.id)
              ? current
              : [...current, data.message].filter(Boolean)
          );
        }
      } catch {
        // ignore
      }
    };
    return () => socket.close();
  }, [ownerId, threadId]);

  async function sendMessage(event) {
    event.preventDefault();
    if (!draft.trim()) return;
    const response = await fetch(`/api/chats/${threadId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderOwnerId: ownerId, content: draft })
    });
    if (response.ok) {
      const payload = await response.json();
      setMessages((current) => [...current, payload.message]);
      setDraft('');
    }
  }

  return (
    <div className="card chat-card">
      <div className="chat-header">
        <span>实时状态：{status}</span>
        <span>Thread: {threadId}</span>
      </div>
      <div className="chat-history">
        {messages.map((message) => (
          <div key={message.id} className={`chat-bubble ${message.senderOwnerId === ownerId ? 'mine' : 'theirs'}`}>
            <div className="chat-text">{message.content}</div>
            <div className="chat-time">{new Date(message.createdAt).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>
      <form className="chat-form" onSubmit={sendMessage}>
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="输入消息..." rows={3} />
        <button className="btn btn-primary" type="submit">
          发送
        </button>
      </form>
    </div>
  );
}
