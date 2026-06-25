import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/app/providers";

export const metadata: Metadata = {
  title: "SiKos - Boarding House Management System",
  description: "Efficiently manage rooms, tenants, payments, and financial reports for your boarding house business.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
