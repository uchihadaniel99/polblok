import type { Metadata, Viewport } from 'next'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import './globals.css'

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
      <body className="bg-background min-h-screen">
        <Sidebar />
        <Header />
        <main className="ml-64 mt-24 p-8">{children}</main>
      </body>
    </html>
  )
}
