'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Coffee,
  Package,
  ShoppingCart,
  ClipboardList,
  FileText,
  AlertCircle,
  ChefHat,
} from 'lucide-react'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/ingredientes', label: 'Ingredientes', icon: Package },
  { href: '/produtos', label: 'Produtos', icon: Coffee },
  { href: '/vendas', label: 'Vendas (POS)', icon: ShoppingCart },
  { href: '/pedidos', label: 'Pedidos', icon: ClipboardList },
  { href: '/producao', label: 'Produção', icon: ChefHat },
  { href: '/relatorios', label: 'Relatórios', icon: FileText },
  { href: '/alertas', label: 'Alertas', icon: AlertCircle },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-primary text-accent shadow-lg overflow-y-auto">
      <div className="p-6 border-b border-secondary">
        <h1 className="text-2xl font-bold text-accent flex items-center gap-2">
          <Coffee size={28} />
          Cafeteria
        </h1>
        <p className="text-sm text-accent/80 mt-1">Gerenciamento</p>
      </div>

      <nav className="p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-secondary text-accent'
                  : 'text-accent hover:bg-secondary/50'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
