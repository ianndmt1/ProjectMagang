"use client";

import { useState, useEffect, useRef } from "react";
import { DEFAULT_APP_SETTINGS, AppSettings } from "@/lib/settings-config";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";

const DEMO_TESTIMONIALS = [
  {
    title: "Servis Kilat & Bergaransi",
    summary: "Laptop mati total langsung ditangani dengan cepat. Penjelasannya transparan dan ada garansi servisnya.",
    author: "Andi P.",
  },
  {
    title: "Pelayanan Ramah & Sangat Membantu",
    summary: "Teknisi sangat sabar menjawab pertanyaan teknis secara sederhana. Sangat direkomendasikan untuk orang awam.",
    author: "Sarah W.",
  },
  {
    title: "Upgrade SSD & RAM Langsung Wus",
    summary: "Laptop tua jadi cepat kembali setelah diupgrade RAM dan SSD. Pengerjaan rapi dan tepat waktu.",
    author: "Rian K.",
  },
  {
    title: "Harga Terjangkau & Transparan",
    summary: "Estimasi biaya diinformasikan di awal sebelum perbaikan. Tidak ada biaya tersembunyi, sangat memuaskan.",
    author: "Dewi A.",
  },
];

/* ─────────────────────────────────────────────
   SVG Icons
───────────────────────────────────────────── */
function IconLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="8" fill="url(#logo-grad)" />
      <path d="M9 10h7a4 4 0 010 8H9V10z" fill="white" />
      <path d="M9 18h8a4 4 0 010 8H9V18z" fill="white" opacity="0.7" />
      <rect x="20" y="12" width="2" height="12" rx="1" fill="white" opacity="0.5" />
      <rect x="24" y="10" width="2" height="16" rx="1" fill="white" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="11" r="1" fill="currentColor" />
      <circle cx="12" cy="11" r="1" fill="currentColor" />
      <circle cx="15" cy="11" r="1" fill="currentColor" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82a19.79 19.79 0 01-3.07-8.69A2 2 0 012 .9H5a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Hero Laptop SVG Illustration
───────────────────────────────────────────── */
function LaptopIllustration() {
  return (
    <div className="relative w-full max-w-[480px] mx-auto select-none px-2 sm:px-0">
      {/* Glow background */}
      <div
        className="absolute inset-0 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #14B8A6 0%, #3B82F6 60%, transparent 100%)" }}
      />

      {/* Main laptop SVG */}
      <svg viewBox="0 0 480 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full relative z-10 h-auto">
        <defs>
          <linearGradient id="screen-grad" x1="0" y1="0" x2="480" y2="280" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="body-grad" x1="0" y1="200" x2="480" y2="340" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="screen-glow" x1="60" y1="30" x2="420" y2="230" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0D9488" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#1E40AF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="teal-blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2DD4BF" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
          <filter id="screen-blur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Laptop lid / screen */}
        <rect x="50" y="20" width="380" height="240" rx="12" fill="url(#screen-grad)" />
        <rect x="50" y="20" width="380" height="240" rx="12" stroke="#334155" strokeWidth="2" />
        {/* Screen bezel inner */}
        <rect x="62" y="32" width="356" height="216" rx="6" fill="url(#screen-glow)" />
        {/* Screen content - code lines */}
        <rect x="80" y="55" width="120" height="6" rx="3" fill="#2DD4BF" opacity="0.8" />
        <rect x="80" y="70" width="80" height="5" rx="2.5" fill="#60A5FA" opacity="0.6" />
        <rect x="96" y="82" width="140" height="5" rx="2.5" fill="#E2E8F0" opacity="0.3" />
        <rect x="96" y="94" width="100" height="5" rx="2.5" fill="#E2E8F0" opacity="0.3" />
        <rect x="80" y="106" width="60" height="5" rx="2.5" fill="#F59E0B" opacity="0.7" />
        <rect x="96" y="118" width="160" height="5" rx="2.5" fill="#E2E8F0" opacity="0.3" />
        <rect x="96" y="130" width="90" height="5" rx="2.5" fill="#E2E8F0" opacity="0.3" />
        <rect x="80" y="142" width="70" height="5" rx="2.5" fill="#2DD4BF" opacity="0.6" />
        <rect x="96" y="154" width="130" height="5" rx="2.5" fill="#E2E8F0" opacity="0.3" />
        <rect x="96" y="166" width="80" height="5" rx="2.5" fill="#60A5FA" opacity="0.5" />

        {/* Cursor blink */}
        <rect x="192" y="166" width="10" height="12" rx="1" fill="#2DD4BF" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0;0.9" dur="1.2s" repeatCount="indefinite" />
        </rect>

        {/* AI logo on screen */}
        <text x="340" y="60" fontFamily="monospace" fontSize="11" fill="#14B8A6" opacity="0.7">AI</text>

        {/* Webcam dot */}
        <circle cx="240" cy="27" r="3" fill="#475569" />
        <circle cx="240" cy="27" r="1.5" fill="#0D9488" opacity="0.5" />

        {/* Laptop base/body */}
        <path d="M20 260 L460 260 L440 285 H40 Z" fill="url(#body-grad)" />
        <path d="M20 260 L460 260 L440 285 H40 Z" stroke="#475569" strokeWidth="1.5" />
        {/* Touchpad */}
        <rect x="180" y="265" width="120" height="12" rx="4" fill="#334155" stroke="#475569" strokeWidth="1" />
        {/* Keyboard rows suggestion */}
        <rect x="60" y="258" width="360" height="3" rx="1.5" fill="#475569" opacity="0.4" />

        {/* Hinges */}
        <rect x="100" y="258" width="280" height="4" rx="2" fill="#0F172A" />
      </svg>

      {/* Floating card 1 — Shield (Garansi) */}
      <div
        className="absolute top-2 right-1 sm:-right-4 animate-float z-20"
      >
        <div className="glass-card rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2.5 sm:gap-3 shadow-2xl" style={{ minWidth: 130 }}>
          <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #14B8A6, #3B82F6)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-bold text-white leading-tight">Bergaransi</div>
            <div className="text-[10px] text-slate-400 leading-tight">Setiap servis</div>
          </div>
        </div>
      </div>

      {/* Floating card 2 — Speed */}
      <div
        className="absolute bottom-12 left-1 sm:-left-4 animate-float-delayed z-20"
      >
        <div className="glass-card rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2.5 sm:gap-3 shadow-2xl" style={{ minWidth: 130 }}>
          <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #F59E0B, #EF4444)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-bold text-white leading-tight">Servis Cepat</div>
            <div className="text-[10px] text-slate-400 leading-tight">Est. 1–3 hari kerja</div>
          </div>
        </div>
      </div>

      {/* Rating badge */}
      <div
        className="absolute top-20 left-1 sm:-left-2 animate-float z-20"
        style={{ animationDelay: "0.8s" }}
      >
        <div
          className="rounded-full px-3 py-1.5 sm:py-2 flex items-center gap-1.5 shadow-xl"
          style={{ background: "linear-gradient(135deg, #14B8A6, #3B82F6)" }}
        >
          <span className="text-yellow-300 text-xs sm:text-sm">★</span>
          <span className="text-white font-bold text-xs sm:text-sm">4.8</span>
          <span className="text-white/70 text-[10px] sm:text-xs">Google</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Service Flow Step Colors
───────────────────────────────────────────── */
const FLOW_STEPS = [
  {
    status: "Diterima",
    detail: "Unit diserahkan & dicatat admin",
    color: "#14B8A6",
    bg: "rgba(20,184,166,0.12)",
    border: "rgba(20,184,166,0.35)",
    num: "01",
  },
  {
    status: "Dicek",
    detail: "Pemeriksaan detail kerusakan komponen",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.12)",
    border: "rgba(59,130,246,0.35)",
    num: "02",
  },
  {
    status: "Menunggu Sparepart",
    detail: "Menanti sparepart jika stok habis",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.35)",
    num: "03",
  },
  {
    status: "Dikerjakan",
    detail: "Proses soldering / pergantian part",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.35)",
    num: "04",
  },
  {
    status: "Selesai",
    detail: "Quality control & pengecekan akhir",
    color: "#22C55E",
    bg: "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.35)",
    num: "05",
  },
  {
    status: "Sudah Diambil",
    detail: "Unit dikembalikan ke pemilik",
    color: "#A855F7",
    bg: "rgba(168,85,247,0.12)",
    border: "rgba(168,85,247,0.35)",
    num: "06",
  },
];

/* ─────────────────────────────────────────────
   Service Category Cards
───────────────────────────────────────────── */
const SERVICE_CATEGORIES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: "Servis Laptop",
    desc: "Perbaikan motherboard, mati total, ganti keyboard, LCD, engsel patah, dan berbagai kerusakan hardware lainnya.",
    color: "#2DD4BF",
    gradient: "linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
    title: "Servis PC",
    desc: "Pembersihan thermal paste, rakit PC gaming/kerja, blue screen, bad power supply, dan troubleshooting lainnya.",
    color: "#60A5FA",
    gradient: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <rect x="7" y="7" width="3" height="3" />
        <rect x="14" y="7" width="3" height="3" />
        <rect x="7" y="14" width="3" height="3" />
        <rect x="14" y="14" width="3" height="3" />
      </svg>
    ),
    title: "Sparepart",
    desc: "RAM DDR4/DDR5, SSD NVMe/SATA, baterai laptop, dan sparepart berkualitas. Harga terjangkau, konsultasi via WhatsApp.",
    color: "#F59E0B",
    gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    title: "Upgrade RAM/SSD",
    desc: "Upgrade RAM & SSD kilat untuk hilangkan lambat pada laptop lama. Selesai hari itu juga, bergaransi.",
    color: "#A855F7",
    gradient: "linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)",
  },
];

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function Home() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((res) => {
        if (res?.data) {
          setSettings(res.data);
        }
      })
      .catch((err) => console.warn("Failed to fetch app settings:", err));
  }, []);
  const [isScrolled, setIsScrolled] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string; showWhatsappButton?: boolean }>>([
    {
      sender: "ai",
      text: "Halo! Ceritakan kerusakan laptop/PC kamu, nanti saya bantu perkirakan penyebabnya. Atau ketik nomor invoice untuk cek status servis.",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isChatOpen, chatMessages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg = { sender: "user" as const, text: text.trim() };

    const history = chatMessages.map(msg => ({
      role: msg.sender === "user" ? "user" : "model",
      text: msg.text
    }));

    setChatMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history })
      });
      const data = await response.json();

      setChatMessages((prev) => [...prev, {
        sender: "ai",
        text: data.reply || "Maaf, AI sedang mengalami gangguan.",
        showWhatsappButton: data.show_whatsapp_button
      }]);
    } catch (error) {
      setChatMessages((prev) => [...prev, {
        sender: "ai",
        text: "Maaf, AI lagi sibuk. Coba beberapa saat lagi atau hubungi kami langsung lewat WhatsApp.",
        showWhatsappButton: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const openChat = () => {
    setIsChatOpen(true);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0F172A", color: "#F1F5F9" }}>
      {/* ─── HEADER ─── */}
      <SiteHeader />

      {/* ─── HERO ─── */}
      <section
        className="relative overflow-hidden pt-12 sm:pt-16 pb-20 sm:pb-24"
        style={{ background: "linear-gradient(160deg, #0F172A 0%, #0D1829 50%, #0F172A 100%)" }}
      >
        {/* Ambient glow blobs */}
        <div
          className="absolute top-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)",
            transform: "translate(-50%, -50%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-72 sm:w-96 h-72 sm:h-96 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
            transform: "translate(50%, 50%)",
            filter: "blur(40px)",
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            {/* Left: copy */}
            <div className="space-y-6 sm:space-y-7 text-left">
              {/* Badge pill */}
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium border"
                style={{
                  background: "rgba(20,184,166,0.1)",
                  borderColor: "rgba(20,184,166,0.3)",
                  color: "#2DD4BF",
                }}
              >
                <span className="text-yellow-400">★</span>
                <span>
                  Rating 4.9 (500+ Ulasan Demo)
                </span>
              </div>

              {/* Headline */}
              <h1
                className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Service Laptop &amp; PC{" "}
                <span className="text-gradient-teal-blue">Cepat, Bergaransi</span>
              </h1>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-lg">
                Solusi servis laptop &amp; komputer terpercaya, cepat, dan bergaransi. Layanan cepat dan transparan untuk kenyamanan Anda.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <a
                  href="/cek-status"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[44px] rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #14B8A6 0%, #3B82F6 100%)",
                    boxShadow: "0 4px 24px rgba(20,184,166,0.35)",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Cek Status Service
                </a>
                <button
                  onClick={openChat}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[44px] rounded-xl font-semibold text-sm transition-all hover:bg-white/10 active:scale-[0.98] border"
                  style={{ borderColor: "rgba(148,163,184,0.25)", color: "#F1F5F9" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  Chat AI Sekarang
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2">
                {[
                  { icon: "🛡️", text: "Bergaransi" },
                  { icon: "⚡", text: "Servis Cepat" },
                  { icon: "🏠", text: "Homeservice" },
                  { icon: "💬", text: "Konsultasi Gratis" },
                ].map((badge) => (
                  <div key={badge.text} className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400">
                    <span>{badge.icon}</span>
                    <span>{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: illustration */}
            <div className="relative flex justify-center lg:justify-end mt-4 lg:mt-0">
              <LaptopIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* ─── KATEGORI LAYANAN ─── */}
      <section id="layanan" className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-xs sm:text-sm font-medium mb-3" style={{ color: "#2DD4BF", fontFamily: "var(--font-mono)" }}>
              — Kategori Layanan —
            </p>
            <h2
              className="text-2xl sm:text-4xl font-bold text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Kami Siap Membantu
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
              Spesialisasi reparasi hardware &amp; software untuk laptop dan PC rakitan Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICE_CATEGORIES.map((cat) => (
              <div
                key={cat.title}
                className="group relative p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              >
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: cat.gradient, color: "white" }}
                >
                  {cat.icon}
                </div>
                <h3
                  className="font-bold text-base text-white mb-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {cat.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">{cat.desc}</p>
                {/* Hover arrow */}
                <div
                  className="mt-4 text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: cat.color }}
                >
                  Lihat detail
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CARA SERVICE ─── */}
      <section
        id="cara-service"
        className="py-16 sm:py-20 px-4 sm:px-6"
        style={{ background: "rgba(255,255,255,0.02)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-xs sm:text-sm font-medium mb-3" style={{ color: "#2DD4BF", fontFamily: "var(--font-mono)" }}>
              — Alur Servis —
            </p>
            <h2
              className="text-2xl sm:text-4xl font-bold text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Cara Kerja Servis Kami
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
              Siklus penanganan unit dari masuk hingga siap diambil. Pantau status dengan nomor invoice kapan saja.
            </p>
          </div>

          {/* Desktop: horizontal */}
          <div className="hidden md:flex items-start gap-0 relative">
            {FLOW_STEPS.map((step, idx) => (
              <div key={step.status} className="flex-1 flex items-start relative">
                {/* Connector line */}
                {idx < FLOW_STEPS.length - 1 && (
                  <div
                    className="absolute top-6 left-[calc(50%+24px)] right-0 h-0.5 z-0"
                    style={{ background: `linear-gradient(90deg, ${step.color}60, ${FLOW_STEPS[idx + 1].color}40)` }}
                  />
                )}
                {/* Step content */}
                <div className="flex flex-col items-center text-center w-full px-2 relative z-10">
                  {/* Node circle */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border-2 shadow-lg mb-4 relative"
                    style={{
                      background: step.bg,
                      borderColor: step.border,
                      color: step.color,
                    }}
                  >
                    {step.num}
                  </div>
                  <h4
                    className="font-semibold text-sm text-white mb-1 leading-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {step.status}
                  </h4>
                  <p className="text-xs text-slate-500 leading-snug">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: vertical */}
          <div className="md:hidden flex flex-col gap-0 pl-2">
            {FLOW_STEPS.map((step, idx) => (
              <div key={step.status} className="flex gap-4 items-start relative">
                {/* Vertical line */}
                {idx < FLOW_STEPS.length - 1 && (
                  <div
                    className="absolute left-5 top-10 bottom-0 w-0.5 z-0"
                    style={{ background: `linear-gradient(180deg, ${step.color}60, ${FLOW_STEPS[idx + 1].color}30)` }}
                  />
                )}
                {/* Node */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 flex-shrink-0 relative z-10"
                  style={{ background: step.bg, borderColor: step.border, color: step.color }}
                >
                  {step.num}
                </div>
                <div className="pb-8 pt-1">
                  <h4
                    className="font-semibold text-sm text-white mb-1"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {step.status}
                  </h4>
                  <p className="text-xs text-slate-500">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Cek Status */}
          <div className="text-center mt-10 sm:mt-12">
            <a
              href="/cek-status"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl font-semibold text-sm border transition-all hover:bg-white/5"
              style={{ borderColor: "rgba(45,212,191,0.4)", color: "#2DD4BF" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Cek Status Service Saya
            </a>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONI ─── */}
      <section id="testimoni" className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-xs sm:text-sm font-medium mb-3" style={{ color: "#2DD4BF", fontFamily: "var(--font-mono)" }}>
              — Ulasan Pelanggan —
            </p>
            <h2
              className="text-2xl sm:text-4xl font-bold text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Dipercaya Pelanggan
              <span className="text-yellow-400 ml-2">(4.9★)</span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400">
              Apa kata pelanggan yang telah menggunakan layanan servis {settings.shop_name}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {DEMO_TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              >
                {/* Stars */}
                <div className="flex items-center justify-between gap-0.5 mb-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="text-yellow-400 text-sm">★</span>
                    ))}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {t.author}
                  </span>
                </div>
                <h4
                  className="font-semibold text-white mb-2 text-base"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  "{t.title}"
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed">{t.summary}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500 mt-6 italic text-center">
            *Testimoni contoh untuk keperluan demo
          </p>
        </div>
      </section>

      {/* ─── LOKASI & JAM ─── */}
      <section
        id="kontak"
        className="py-16 sm:py-20 px-4 sm:px-6"
        style={{ background: "rgba(255,255,255,0.02)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-xs sm:text-sm font-medium mb-3" style={{ color: "#2DD4BF", fontFamily: "var(--font-mono)" }}>
              — Temukan Kami —
            </p>
            <h2
              className="text-2xl sm:text-4xl font-bold text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Lokasi &amp; Jam Operasional
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Info cards */}
            <div className="space-y-5">
              {/* Alamat */}
              <div
                className="flex gap-4 p-5 rounded-2xl border"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #14B8A6, #3B82F6)" }}
                >
                  <IconMapPin />
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "var(--font-mono)" }}>
                    Alamat Workshop
                  </div>
                  <div className="text-sm text-slate-200 leading-relaxed">{settings.shop_address}</div>
                </div>
              </div>

              {/* Jam operasional */}
              <div
                className="flex gap-4 p-5 rounded-2xl border"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #EF4444)" }}
                >
                  <IconClock />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-mono)" }}>
                    Jam Operasional Toko
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                      <span className="text-slate-400">Jam Operasional</span>
                      <span className="font-medium px-2 py-0.5 rounded-md text-xs text-emerald-400 bg-emerald-500/10">
                        {settings.operational_hours}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kontak */}
              <div
                className="flex gap-4 p-5 rounded-2xl border"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)" }}
                >
                  <IconPhone />
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "var(--font-mono)" }}>
                    Telepon / WhatsApp
                  </div>
                  <div className="text-sm text-slate-200 font-medium">{settings.shop_whatsapp}</div>
                  <a
                    href={`https://wa.me/${settings.shop_whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium hover:underline min-h-[36px]"
                    style={{ color: "#22C55E" }}
                  >
                    <IconWhatsApp />
                    Chat via WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Map embed placeholder */}
            <div
              className="rounded-2xl border overflow-hidden relative min-h-[280px] sm:min-h-[320px] flex flex-col items-center justify-center"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}
            >
              {/* Decorative map-like SVG */}
              <svg
                className="absolute inset-0 w-full h-full opacity-10"
                viewBox="0 0 400 300"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M0 150 H400" stroke="#2DD4BF" strokeWidth="3" />
                <path d="M200 0 V300" stroke="#3B82F6" strokeWidth="3" />
                <path d="M0 80 L120 80 L120 150" stroke="#2DD4BF" strokeWidth="2" />
                <path d="M400 220 L280 220 L280 150" stroke="#3B82F6" strokeWidth="2" />
                <path d="M80 0 L80 80" stroke="#2DD4BF" strokeWidth="1.5" />
                <path d="M320 300 L320 220" stroke="#3B82F6" strokeWidth="1.5" />
                <rect x="30" y="100" width="70" height="40" rx="4" fill="#334155" opacity="0.5" />
                <rect x="230" y="160" width="50" height="50" rx="4" fill="#334155" opacity="0.5" />
                <rect x="130" y="20" width="60" height="55" rx="4" fill="#334155" opacity="0.5" />
                <rect x="130" y="160" width="60" height="40" rx="4" fill="#334155" opacity="0.5" />
                <circle cx="200" cy="150" r="12" fill="#14B8A6" opacity="0.8" />
                <circle cx="200" cy="150" r="6" fill="white" />
                <circle cx="200" cy="150" r="20" stroke="#14B8A6" strokeWidth="2" strokeDasharray="4 4" opacity="0.4" />
              </svg>
              {/* Overlay card */}
              <div
                className="relative z-10 text-center p-6 rounded-xl border max-w-xs mx-auto"
                style={{ background: "rgba(15,23,42,0.85)", borderColor: "rgba(20,184,166,0.3)" }}
              >
                <div className="text-3xl mb-3">📍</div>
                <p
                  className="font-bold text-white text-base mb-1"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {settings.shop_name}
                </p>
                <p className="text-xs text-slate-400 mb-2">{settings.shop_address}</p>
                <p className="text-xs text-teal-400 font-mono italic">
                  Lokasi toko akan tampil di sini
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <SiteFooter settings={settings} />

      {/* ─── FLOATING CHAT WIDGET ─── */}
      <>
        {/* Chat panel */}
        {isChatOpen && (
          <>
            {/* Mobile overlay */}
            <div
              className="fixed inset-0 bg-black/60 z-40 sm:hidden animate-fade-in"
              onClick={() => setIsChatOpen(false)}
            />

            {/* Panel: bottom sheet on mobile (<640px), floating panel on desktop */}
            <div
              ref={chatPanelRef}
              className="fixed z-50 flex flex-col overflow-hidden shadow-2xl animate-slide-up max-sm:inset-x-0 max-sm:bottom-0 max-sm:h-[85vh] max-sm:rounded-t-3xl sm:bottom-[80px] sm:right-6 sm:w-[380px] sm:h-[520px] sm:rounded-2xl"
              style={{
                background: "#111827",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              {/* Handle bar for mobile bottom sheet */}
              <div
                className="sm:hidden flex justify-center pt-2.5 pb-1 cursor-pointer flex-shrink-0"
                onClick={() => setIsChatOpen(false)}
              >
                <div className="w-12 h-1.5 rounded-full bg-slate-600/70" />
              </div>

              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-3.5 sm:py-4 border-b flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #14B8A6 0%, #3B82F6 100%)",
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
                      Asisten {settings.shop_name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
                      <span className="text-xs text-white/70">AI · Online</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Tutup chat"
                >
                  <IconX />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.sender === "ai" && (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5"
                        style={{ background: "linear-gradient(135deg, #14B8A6, #3B82F6)" }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                        </svg>
                      </div>
                    )}
                    <div
                      className="max-w-[85%] sm:max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line"
                      style={
                        msg.sender === "user"
                          ? {
                            background: "linear-gradient(135deg, #14B8A6, #3B82F6)",
                            color: "white",
                            borderBottomRightRadius: "4px",
                          }
                          : {
                            background: "rgba(255,255,255,0.06)",
                            color: "#E2E8F0",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderBottomLeftRadius: "4px",
                          }
                      }
                    >
                      {msg.text}
                      {msg.showWhatsappButton && (
                        <a
                          href={`https://wa.me/${settings.shop_whatsapp}?text=Halo%20${encodeURIComponent(settings.shop_name)}%2C%20saya%20ingin%20konsultasi%20mengenai%20servis%20laptop.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 min-h-[44px] rounded-lg text-xs font-semibold text-white transition-all hover:brightness-110"
                          style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)" }}
                        >
                          <IconWhatsApp />
                          Hubungi Admin
                        </a>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5"
                      style={{ background: "linear-gradient(135deg, #14B8A6, #3B82F6)" }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                      </svg>
                    </div>
                    <div
                      className="px-4 py-3 rounded-2xl flex items-center gap-1"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderBottomLeftRadius: "4px",
                      }}
                    >
                      {[0, 0.2, 0.4].map((delay, i) => (
                        <span
                          key={i}
                          className="w-2 h-2 rounded-full bg-slate-400"
                          style={{ animation: `pulse-slow 1s ease-in-out ${delay}s infinite` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* WhatsApp CTA */}
              <div
                className="px-4 py-3 border-t flex-shrink-0"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                <a
                  href={`https://wa.me/${settings.shop_whatsapp}?text=Halo%20${encodeURIComponent(settings.shop_name)}%2C%20saya%20ingin%20konsultasi%20mengenai%20servis%20laptop.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)" }}
                >
                  <IconWhatsApp />
                  Hubungi via WhatsApp
                </a>
              </div>

              {/* Input */}
              <div
                className="px-4 pb-4 pt-2 flex-shrink-0 flex gap-2"
                style={{ background: "#111827" }}
              >
                <input
                  type="text"
                  placeholder="Ceritakan kerusakan laptop/PC kamu..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isTyping && handleSendMessage(inputMessage)}
                  disabled={isTyping}
                  className="flex-1 px-4 py-2.5 min-h-[44px] rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "#F1F5F9",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(20,184,166,0.5)";
                    e.target.style.boxShadow = "0 0 0 2px rgba(20,184,166,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.10)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  onClick={() => handleSendMessage(inputMessage)}
                  disabled={!inputMessage.trim() || isTyping}
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all hover:brightness-110 disabled:opacity-40 flex-shrink-0 min-h-[44px] min-w-[44px]"
                  style={{ background: "linear-gradient(135deg, #14B8A6, #3B82F6)" }}
                >
                  <IconSend />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Floating button */}
        <button
          id="chat-widget-btn"
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all hover:scale-110 active:scale-95 min-h-[44px] min-w-[44px]"
          style={{
            background: isChatOpen
              ? "rgba(30,41,59,0.95)"
              : "linear-gradient(135deg, #14B8A6 0%, #3B82F6 100%)",
            boxShadow: isChatOpen
              ? "0 4px 24px rgba(0,0,0,0.4)"
              : "0 4px 24px rgba(20,184,166,0.5)",
            border: "2px solid rgba(255,255,255,0.15)",
          }}
          aria-label={isChatOpen ? "Tutup chat" : "Buka chat AI"}
        >
          {isChatOpen ? <IconX /> : <IconChat />}
          {!isChatOpen && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-bold text-white animate-pulse-slow"
            >
              AI
            </span>
          )}
        </button>
      </>
    </div>
  );
}
