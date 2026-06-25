'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AiChatWidgetProps {
  isOpenExternal?: boolean;
  onCloseExternal?: () => void;
}

export default function AiChatWidget({ isOpenExternal, onCloseExternal }: AiChatWidgetProps) {
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasOpened, setHasOpened] = useState(false);

  const isOpen = isOpenExternal !== undefined ? isOpenExternal : isOpenInternal;

  const toggleChat = () => {
    if (onCloseExternal && isOpenExternal) {
      onCloseExternal();
    } else {
      setIsOpenInternal(!isOpenInternal);
    }
  };

  const handleClose = () => {
    if (onCloseExternal) {
      onCloseExternal();
    } else {
      setIsOpenInternal(false);
    }
  };

  // Auto-welcome message on first open
  useEffect(() => {
    if (isOpen && !hasOpened) {
      setMessages([
        {
          role: 'assistant',
          content: 'Halo! Saya asisten Santdoor. Mau cari jaket, kemeja, atau pakaian lainnya? Ceritakan kebutuhanmu 😊',
        },
      ]);
      setHasOpened(true);
    }
  }, [isOpen, hasOpened]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error('Gagal menghubungi AI');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Maaf, terjadi kesalahan saat menghubungi asisten AI. Silakan coba lagi.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="flex items-center gap-2 px-5 py-3 bg-rust text-bg hover:bg-rust/90 active:scale-95 shadow-2xl shadow-text-main/20 transition-all duration-300 rounded-full border border-paper/10 select-none group focus:outline-none"
          aria-label="Buka AI Assistant"
        >
          <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          <span className="font-display text-xs font-bold uppercase tracking-wider">Tanya AI</span>
          {/* Notification dot */}
          <div className="w-2 h-2 rounded-full bg-mustard animate-pulse" />
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] h-[500px] bg-bg border border-hairline flex flex-col shadow-2xl shadow-text-main/15 transition-all duration-300 origin-bottom-right">
          {/* Header */}
          <div className="px-4 py-3 bg-panel border-b border-hairline flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="flex items-center justify-center w-8 h-8 bg-rust text-paper font-display text-xs font-bold rounded-full">
                AI
              </div>
              <div>
                <h4 className="font-display text-xs font-bold text-text-main uppercase tracking-wider">
                  Santdoor Assistant
                </h4>
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-olive animate-pulse" />
                  <span className="text-[9px] text-text-muted font-mono uppercase tracking-widest">
                    Online
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 text-text-muted hover:text-text-main border border-transparent hover:border-hairline hover:bg-bg transition-all rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-grow p-4 space-y-4 overflow-y-auto bg-bg select-text">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}
              >
                {/* Meta */}
                <span className="font-mono text-[8px] text-text-muted">
                  {msg.role === 'user' ? 'PEMBELI' : 'SANTDOOR ASSISTANT'}
                </span>

                {/* Bubble */}
                <div
                  className={`px-3 py-2.5 text-xs max-w-[85%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#1A1A1A] text-white rounded-2xl rounded-tr-sm'
                      : 'bg-white border border-[#E8E6E1] text-text-main rounded-2xl rounded-tl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex flex-col items-start space-y-1">
                <span className="font-mono text-[8px] text-text-muted">SANTDOOR ASSISTANT // MENGETIK...</span>
                <div className="bg-white border border-[#E8E6E1] text-text-main px-4 py-2.5 rounded-2xl rounded-tl-sm flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-[#1A1A1A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#1A1A1A] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#1A1A1A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form Input */}
          <form
            onSubmit={handleSubmit}
            className="p-3 border-t border-hairline bg-panel flex space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya asisten Santdoor..."
              className="flex-grow bg-bg border border-hairline rounded-full px-4 py-2 font-sans text-[11px] text-text-main placeholder-text-muted focus:outline-none focus:border-rust/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-full bg-rust text-paper hover:bg-rust/90 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center flex-shrink-0"
              aria-label="Kirim pesan"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
