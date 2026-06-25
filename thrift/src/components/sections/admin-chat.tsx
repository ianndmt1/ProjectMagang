'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, BarChart2 } from 'lucide-react';

interface Message {
  id: string;
  sender: 'admin' | 'ai';
  text: string;
  timestamp: string;
  chart?: boolean;
}

export default function AdminChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'admin-msg-1',
      sender: 'ai',
      text: 'Halo Admin! Saya SANTDOOR Inventory Analyst. Saya bisa memberikan laporan penjualan, estimasi nilai aset gudang, atau rekomendasi restock brand.',
      timestamp: '16:45'
    },
    {
      id: 'admin-msg-2',
      sender: 'admin',
      text: 'Tampilkan perbandingan unit gear yang terjual bulan ini.',
      timestamp: '16:46'
    },
    {
      id: 'admin-msg-3',
      sender: 'ai',
      text: 'Siap Admin. Berikut adalah statistik perbandingan jumlah unit gear terjual berdasarkan kategori produk pada bulan Juni 2026:',
      timestamp: '16:46',
      chart: true
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const newMsg: Message = {
      id: `admin-msg-${Date.now()}`,
      sender: 'admin',
      text: inputVal,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputVal('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      const query = inputVal.toLowerCase();
      let replyText = 'Laporan khusus sedang dikompilasi. Data mock gudang mendeteksi mayoritas pergerakan stock ada pada brand The North Face dan Arc\'teryx.';

      if (query.includes('aset') || query.includes('nilai')) {
        replyText = 'Estimasi total aset gear aktif (belum terjual) di gudang Klaten saat ini bernilai Rp 6.200.000, didominasi oleh segmen Premium Hard Shell (Arc\'teryx Beta LT).';
      } else if (query.includes('laku') || query.includes('terlaris')) {
        replyText = 'Brand paling cepat berputar (fastest turnaround) bulan ini adalah The North Face (rata-rata 3 hari sejak restock), disusul oleh Napapijri Anorak.';
      }

      const aiMsg: Message = {
        id: `admin-msg-${Date.now() + 1}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-[500px] bg-white border border-[#E8E6E1] rounded-[2px] overflow-hidden font-sans shadow-[0_1px_8px_rgba(0,0,0,0.03)]">

      {/* ── Header ── */}
      <div className="px-4 py-3 bg-[#F8F6F1] border-b border-[#E8E6E1] flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 bg-[#1A1A1A] text-[#F8F6F1] rounded-[2px] font-mono text-xs font-bold select-none flex-shrink-0">
          AN
        </div>
        <div className="flex-grow min-w-0">
          <h4 className="font-sans text-[11px] font-bold text-text-main uppercase tracking-widest">
            Inventory Analyst
          </h4>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse flex-shrink-0" />
            <span className="text-[9px] text-[#2E7D32] font-mono uppercase tracking-widest font-semibold">
              Admin AI · Siap
            </span>
          </div>
        </div>
        <span className="hidden sm:inline-flex text-[9px] font-mono font-bold text-tan uppercase tracking-widest bg-tan/10 border border-tan/20 px-2 py-0.5 rounded-[2px] flex-shrink-0">
          AI Co-Pilot
        </span>
      </div>

      {/* ── Message Feed ── */}
      <div className="flex-grow p-4 space-y-4 overflow-y-auto bg-[#F4F2ED] select-text">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'} space-y-1`}
          >
            <span className="font-mono text-[8px] text-text-muted uppercase tracking-widest">
              {msg.sender === 'admin' ? 'Admin' : 'Analyst AI'} · {msg.timestamp}
            </span>

            <div
              className={`px-3.5 py-2.5 text-xs max-w-[88%] leading-relaxed rounded-[2px] ${
                msg.sender === 'admin'
                  ? 'bg-[#1A1A1A] text-[#F8F6F1]'
                  : 'bg-white text-text-main border border-[#E8E6E1] shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Render SVG bar chart */}
              {msg.chart && (
                <div className="mt-3 bg-white border border-[#E8E6E1] p-3 rounded-[2px]">
                  <div className="flex items-center space-x-1.5 mb-3 font-mono text-[9px] text-tan font-bold">
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>GEAR SOLD BY CATEGORY (QTY)</span>
                  </div>

                  {/* SVG Chart */}
                  <svg viewBox="0 0 240 140" className="w-full h-auto select-none">
                    {/* Background Grid Lines */}
                    <line x1="30" y1="20" x2="230" y2="20" stroke="#E8E6E1" strokeWidth="1" />
                    <line x1="30" y1="50" x2="230" y2="50" stroke="#E8E6E1" strokeWidth="1" />
                    <line x1="30" y1="80" x2="230" y2="80" stroke="#E8E6E1" strokeWidth="1" />
                    <line x1="30" y1="110" x2="230" y2="110" stroke="#E8E6E1" strokeWidth="1" />

                    {/* Left Qty labels */}
                    <text x="15" y="24" fill="#9A9087" fontSize="8" fontFamily="var(--font-space-mono)" textAnchor="middle">6</text>
                    <text x="15" y="54" fill="#9A9087" fontSize="8" fontFamily="var(--font-space-mono)" textAnchor="middle">4</text>
                    <text x="15" y="84" fill="#9A9087" fontSize="8" fontFamily="var(--font-space-mono)" textAnchor="middle">2</text>
                    <text x="15" y="114" fill="#9A9087" fontSize="8" fontFamily="var(--font-space-mono)" textAnchor="middle">0</text>

                    {/* Bar 1: Hard Shell (5 units) — rust */}
                    <rect x="45" y="35" width="22" height="75" fill="#E8472A" rx="1" />
                    <text x="56" y="30" fill="#1A1A1A" fontSize="8" fontFamily="var(--font-space-mono)" textAnchor="middle" fontWeight="bold">5</text>
                    <text x="56" y="124" fill="#9A9087" fontSize="7" fontFamily="var(--font-work-sans)" textAnchor="middle">Shell</text>

                    {/* Bar 2: Anorak (2 units) — tan */}
                    <rect x="95" y="80" width="22" height="30" fill="#C8A882" rx="1" />
                    <text x="106" y="75" fill="#1A1A1A" fontSize="8" fontFamily="var(--font-space-mono)" textAnchor="middle" fontWeight="bold">2</text>
                    <text x="106" y="124" fill="#9A9087" fontSize="7" fontFamily="var(--font-work-sans)" textAnchor="middle">Anorak</text>

                    {/* Bar 3: Fleece (4 units) — dark */}
                    <rect x="145" y="50" width="22" height="60" fill="#1A1A1A" rx="1" />
                    <text x="156" y="45" fill="#1A1A1A" fontSize="8" fontFamily="var(--font-space-mono)" textAnchor="middle" fontWeight="bold">4</text>
                    <text x="156" y="124" fill="#9A9087" fontSize="7" fontFamily="var(--font-work-sans)" textAnchor="middle">Fleece</text>

                    {/* Bar 4: Windbreaker (3 units) — medium grey */}
                    <rect x="195" y="65" width="22" height="45" fill="#9A9087" rx="1" />
                    <text x="206" y="60" fill="#1A1A1A" fontSize="8" fontFamily="var(--font-space-mono)" textAnchor="middle" fontWeight="bold">3</text>
                    <text x="206" y="124" fill="#9A9087" fontSize="7" fontFamily="var(--font-work-sans)" textAnchor="middle">Windbr</text>
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* AI Typing Indicator */}
        {isTyping && (
          <div className="flex flex-col items-start space-y-1">
            <span className="font-mono text-[8px] text-text-muted uppercase tracking-widest">Analyst AI · Menganalisis...</span>
            <div className="bg-white border border-[#E8E6E1] text-text-muted px-3.5 py-2.5 rounded-[2px] flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-[#C8A882] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-[#C8A882] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-[#C8A882] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Form ── */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-[#E8E6E1] bg-white flex space-x-2"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Tanya perputaran stok, nilai aset, dll..."
          className="flex-grow bg-[#F8F6F1] border border-[#1A1A1A] rounded-[2px] px-3.5 py-2 font-sans text-xs text-text-main placeholder-text-muted/60 focus:outline-none focus:border-[#E8472A] transition-colors"
          style={{ borderWidth: '1.5px' }}
        />
        <button
          type="submit"
          disabled={!inputVal.trim()}
          className="bg-[#1A1A1A] text-[#F8F6F1] rounded-[2px] px-3.5 hover:bg-[#E8472A] active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer"
          aria-label="Kirim pertanyaan ke Analyst AI"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

    </div>
  );
}
