"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, MessageCircle, ArrowLeft, Send, Trash2 } from "lucide-react";
import { LoadingSpinner } from "./shared";

interface ChatPreview {
  conversation_id: string;
  user_id: string;
  message_count: number;
  updated_at: string;
  first_name: string | null;
  username: string | null;
  last_message: string | null;
  last_message_role: string | null;
}

interface ChatMessage {
  role: string;
  content: string;
  created_at: string;
}

export function ChatsTab({ companionId }: { companionId: string }) {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<ChatPreview | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { loadChats(); }, [companionId]);

  const loadChats = async () => {
    try {
      const res = await fetch(`/api/panel-chats?companionId=${companionId}`);
      const data = await res.json();
      setChats(data.chats || []);
    } finally { setLoading(false); }
  };

  const openChat = async (chat: ChatPreview) => {
    setActiveChat(chat);
    setMsgsLoading(true);
    try {
      const res = await fetch(`/api/panel-chats/messages?conversationId=${chat.conversation_id}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } finally { setMsgsLoading(false); }
  };

  const sendReply = async () => {
    if (!reply.trim() || !activeChat) return;
    setSending(true);
    try {
      await fetch('/api/panel-chats/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeChat.conversation_id, content: reply.trim() }),
      });
      setMessages(prev => [...prev, { role: 'companion', content: reply.trim(), created_at: new Date().toISOString() }]);
      setReply('');
    } finally { setSending(false); }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  if (loading) return <LoadingSpinner />;

  if (activeChat) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col" style={{ minHeight: 'calc(100vh - 180px)' }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setActiveChat(null)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1" />
          <button
            onClick={async () => {
              if (!confirm('Eliminar esta conversación?')) return;
              try {
                await fetch('/api/panel-chats', {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ conversationId: activeChat.conversation_id }),
                });
                setActiveChat(null);
                await loadChats();
              } catch {
                alert('Error al eliminar conversación');
              }
            }}
            className="text-red-400 p-2"
            title="Eliminar conversación"
          >
            <Trash2 size={18} />
          </button>
          <div>
            <p className="text-foreground font-medium text-sm">{activeChat.first_name || activeChat.username || 'Usuario'}</p>
            <p className="text-[10px] text-muted-foreground">{activeChat.message_count} mensajes</p>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto mb-4 max-h-[55vh]">
          {msgsLoading ? <LoadingSpinner /> : messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'companion' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                msg.role === 'companion'
                  ? 'bg-primary/20 border border-primary/30 text-foreground'
                  : 'bg-card border border-border text-foreground'
              }`}>
                <p>{msg.content}</p>
                <p className="text-[9px] text-muted-foreground mt-1">{timeAgo(msg.created_at)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-auto">
          <input
            className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none"
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Escribe tu respuesta..."
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
          />
          <button
            onClick={sendReply}
            disabled={!reply.trim() || sending}
            className="bg-primary text-primary-foreground rounded-xl px-4 disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h3 className="font-serif text-base text-foreground mb-3">Mensajes de usuarios</h3>
      {chats.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Aun no tienes mensajes</p>
          <p className="text-xs text-muted-foreground mt-1">Cuando alguien te escriba aparecera aqui</p>
        </div>
      ) : (
        <div className="space-y-2">
          {chats.map(chat => (
            <button
              key={chat.conversation_id}
              onClick={() => openChat(chat)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{chat.first_name || chat.username || 'Usuario'}</span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(chat.updated_at)}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {chat.last_message_role === 'companion' ? 'Tu: ' : ''}{chat.last_message || '...'}
                </p>
              </div>
              {chat.last_message_role === 'user' && (
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
