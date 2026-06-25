import type { Metadata } from "next";
import { Playfair_Display, Work_Sans, Space_Mono, Oswald } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SANTDOOR.2ND | Outdoor Gear & Thrift Surplus",
  description: "Surplus thrift store jaket outdoor second (The North Face, Napapijri, Patagonia, Columbia) berkualitas berbasis di Klaten, Jawa Tengah.",
  keywords: ["thrift", "outdoor jacket", "second hand", "Klaten", "The North Face second", "Napapijri second"],
  authors: [{ name: "SANTDOOR.2ND Owner" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: next-themes adds/removes .dark class on <html>
    // causing a mismatch between SSR and client — this suppresses it intentionally
    <html
      lang="id"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${playfair.variable} ${oswald.variable} ${workSans.variable} ${spaceMono.variable} h-full antialiased`}
    >
      {/*
        suppressHydrationWarning on <body>: browser security extensions (e.g. Kaspersky,
        Bitdefender) inject attributes like bis_skin_checked, __processed_<uuid>__ before
        React hydrates. This is intentional and scoped only to <body>.
      */}
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-sans bg-bg text-text-main selection:bg-rust selection:text-paper"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
