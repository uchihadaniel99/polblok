import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Cafeteria & Confeitaria - Sistema de Gerenciamento',
  description: 'Sistema profissional de POS para cafeteria e confeitaria',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans bg-background min-h-screen`}>
        <Sidebar />
        <Header />
        <main className="ml-64 mt-24 p-8">{children}</main>
      </body>
    </html>
  )
}
