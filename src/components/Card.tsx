interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 ${className}`}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'danger'
}

const colorMap = {
  primary: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
}

export function StatCard({
  label,
  value,
  icon,
  color = 'primary',
}: StatCardProps) {
  return (
    <Card className="flex items-start justify-between">
      <div>
        <p className="text-gray-600 text-sm mb-2">{label}</p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
      </div>
      {icon && (
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>{icon}</div>
      )}
    </Card>
  )
}
