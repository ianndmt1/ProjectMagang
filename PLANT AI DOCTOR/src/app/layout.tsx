import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bakoel Kembang Boyolali | Toko Bunga & Tanaman',
  description: 'Toko bunga dan tanaman terpercaya di Boyolali. Tersedia berbagai jenis bunga, tanaman hias, pupuk, dan obat tanaman. Dilengkapi fitur AI Plant Doctor untuk diagnosis penyakit tanaman.',
  keywords: 'toko bunga boyolali, tanaman hias boyolali, bunga segar boyolali, pupuk tanaman, obat tanaman',
  openGraph: {
    title: 'Bakoel Kembang Boyolali',
    description: 'Toko bunga & tanaman dengan AI Plant Doctor',
    locale: 'id_ID',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col antialiased`}>
        {children}
      </body>
    </html>
  )
}
