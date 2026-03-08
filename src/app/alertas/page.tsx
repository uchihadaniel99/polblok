'use client'

import { useEffect, useState } from 'react'
import { db, Ingredient, Order } from '@/lib/database'
import { Card } from '@/components/Card'
import {
  AlertTriangle,
  Clock,
  Package,
  Truck,
  TrendingDown,
} from 'lucide-react'

interface Alert {
  id: string
  type: 'low_stock' | 'overdue_pickup' | 'upcoming_pickup'
  severity: 'low' | 'medium' | 'high'
  title: string
  message: string
  icon: React.ReactNode
  bgColor: string
  borderColor: string
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    const ings = await db.ingredients.toArray()
    const ords = await db.orders.toArray()

    setIngredients(ings)
    setOrders(ords)

    const generatedAlerts: Alert[] = []

    // Alerta de estoque baixo
    ings.forEach((ing) => {
      if (ing.stockQuantity <= ing.minimumStock) {
        const percentageLeft = (ing.stockQuantity / ing.minimumStock) * 100
        const severity: 'low' | 'medium' | 'high' =
          ing.stockQuantity === 0
            ? 'high'
            : percentageLeft < 50
            ? 'high'
            : percentageLeft < 75
            ? 'medium'
            : 'low'

        generatedAlerts.push({
          id: `stock-${ing.id}`,
          type: 'low_stock',
          severity,
          title: `Estoque Baixo: ${ing.name}`,
          message: `${ing.name} tem ${ing.stockQuantity} ${ing.unit} disponível (mínimo: ${ing.minimumStock})`,
          icon: <Package size={24} />,
          bgColor:
            severity === 'high'
              ? 'bg-red-50'
              : severity === 'medium'
              ? 'bg-yellow-50'
              : 'bg-orange-50',
          borderColor:
            severity === 'high'
              ? 'border-l-red-500'
              : severity === 'medium'
              ? 'border-l-yellow-500'
              : 'border-l-orange-500',
        })
      }
    })

    // Alerta de pedidos vencidos
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    ords.forEach((ord) => {
      const pickupDate = new Date(ord.pickupDate)
      pickupDate.setHours(0, 0, 0, 0)

      if (pickupDate < today && ord.status !== 'entregue') {
        const daysOverdue = Math.floor(
          (today.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24)
        )
        generatedAlerts.push({
          id: `overdue-${ord.id}`,
          type: 'overdue_pickup',
          severity: daysOverdue > 5 ? 'high' : 'medium',
          title: `Retirada Vencida: ${ord.customerName}`,
          message: `Pedido de "${ord.productName}" está ${daysOverdue} dia(s) vencido`,
          icon: <Truck size={24} />,
          bgColor: daysOverdue > 5 ? 'bg-red-50' : 'bg-yellow-50',
          borderColor: daysOverdue > 5 ? 'border-l-red-500' : 'border-l-yellow-500',
        })
      }

      // Alerta de retirada próxima
      const daysUntilPickup = Math.floor(
        (pickupDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysUntilPickup === 0 && ord.status !== 'entregue') {
        generatedAlerts.push({
          id: `upcoming-${ord.id}`,
          type: 'upcoming_pickup',
          severity: 'medium',
          title: `Retirada Hoje: ${ord.customerName}`,
          message: `Pedido de "${ord.productName}" para retirar hoje`,
          icon: <Clock size={24} />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-l-blue-500',
        })
      }
    })

    // Ordenar por severidade
    const severityOrder = { high: 0, medium: 1, low: 2 }
    generatedAlerts.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    )

    setAlerts(generatedAlerts)
  }

  const highSeverityCount = alerts.filter((a) => a.severity === 'high').length
  const mediumSeverityCount = alerts.filter((a) => a.severity === 'medium')
    .length

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-foreground">Alertas & Notificações</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Alertas Críticos</p>
              <p className="text-3xl font-bold text-danger">{highSeverityCount}</p>
            </div>
            <AlertTriangle size={32} className="text-danger" />
          </div>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Alertas de Aviso</p>
              <p className="text-3xl font-bold text-warning">
                {mediumSeverityCount}
              </p>
            </div>
            <AlertTriangle size={32} className="text-warning" />
          </div>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total de Alertas</p>
              <p className="text-3xl font-bold text-primary">{alerts.length}</p>
            </div>
            <Package size={32} className="text-primary" />
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {alerts.length === 0 ? (
          <Card className="text-center py-12 border-2 border-green-200 bg-green-50">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-success text-white rounded-full">
                <AlertTriangle size={32} />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-success mb-2">
              Nenhum Alerta!
            </h2>
            <p className="text-gray-600">
              Tudo está funcionando perfeitamente. Continue acompanhando seu
              negócio!
            </p>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card
              key={alert.id}
              className={`border-l-4 ${alert.borderColor} ${alert.bgColor}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div
                    className={`p-2 rounded-lg ${
                      alert.severity === 'high'
                        ? 'bg-red-100 text-red-600'
                        : alert.severity === 'medium'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-orange-100 text-orange-600'
                    }`}
                  >
                    {alert.icon}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {alert.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        alert.severity === 'high'
                          ? 'bg-red-200 text-red-800'
                          : alert.severity === 'medium'
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-orange-200 text-orange-800'
                      }`}
                    >
                      {alert.severity === 'high'
                        ? 'Crítico'
                        : alert.severity === 'medium'
                        ? 'Aviso'
                        : 'Baixo'}
                    </span>
                  </div>
                  <p className="text-gray-600">{alert.message}</p>
                </div>

                <button
                  onClick={() =>
                    alert.type === 'low_stock'
                      ? window.location.href = '/ingredientes'
                      : window.location.href = '/pedidos'
                  }
                  className="px-4 py-2 bg-primary text-accent rounded-lg hover:bg-secondary transition-colors font-semibold flex-shrink-0"
                >
                  Ver
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Resumo Semanal */}
      <Card>
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          Resumo da Semana
        </h2>
        <div className="space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-semibold text-foreground mb-2">
              Ingredientes com Estoque Baixo
            </h3>
            <div className="space-y-2">
              {ingredients
                .filter((i) => i.stockQuantity <= i.minimumStock)
                .slice(0, 5)
                .map((ing) => (
                  <div key={ing.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{ing.name}</span>
                    <span className="font-semibold text-danger">
                      {ing.stockQuantity}/{ing.minimumStock} {ing.unit}
                    </span>
                  </div>
                ))}
              {ingredients.filter((i) => i.stockQuantity <= i.minimumStock)
                .length === 0 && (
                <p className="text-gray-500 text-sm">
                  Todos os ingredientes com estoque normal
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Pedidos Pendentes
            </h3>
            <div className="space-y-2">
              {orders
                .filter((o) => o.status !== 'entregue')
                .slice(0, 5)
                .map((ord) => (
                  <div
                    key={ord.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-gray-600">
                      {ord.customerName} - {ord.productName}
                    </span>
                    <span className="font-semibold text-warning">
                      {new Date(ord.pickupDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))}
              {orders.filter((o) => o.status !== 'entregue').length === 0 && (
                <p className="text-gray-500 text-sm">
                  Nenhum pedido pendente
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
