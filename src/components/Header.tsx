'use client'

import { Clock } from 'lucide-react'
import { useEffect, useState } from 'react'

export function Header() {
  const [time, setTime] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="fixed top-0 left-64 right-0 bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm z-40">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </h2>
      </div>

      <div className="flex items-center gap-2 text-lg font-semibold text-primary">
        <Clock size={24} />
        <span>{time}</span>
      </div>
    </header>
  )
}
