'use client'

import { useEffect, useState } from 'react'
import { db, Sale, Product, Ingredient, Order } from '@/lib/database'
import { StatCard, Card } from '@/components/Card'
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export default function DashboardPage() {
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [todaySales, setTodaySales] = useState(0)
  const [bestSellingProduct, setBestSellingProduct] = useState<string>('')
  const [lowStockItems, setLowStockItems] = useState(0)
  const [dailyData, setDailyData] = useState<any>(null)
  const [monthlyData, setMonthlyData] = useState<any>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    const sales = await db.sales.toArray()
    const ingredients = await db.ingredients.toArray()

    // Cálculo de receita e vendas de hoje
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todaySalesData = sales.filter((s) => {
      const saleDate = new Date(s.date)
      saleDate.setHours(0, 0, 0, 0)
      return saleDate.getTime() === today.getTime()
    })

    const revenue = todaySalesData.reduce((sum, s) => sum + s.totalPrice, 0)
    setTodayRevenue(revenue)
    setTodaySales(todaySalesData.length)

    // Produto mais vendido
    const productSales = todaySalesData.reduce(
      (acc, s) => {
        acc[s.productName] = (acc[s.productName] || 0) + s.quantity
        return acc
      },
      {} as Record<string, number>
    )
    const bestProduct = Object.entries(productSales).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0]
    setBestSellingProduct(bestProduct || 'Nenhum')

    // Alertas de estoque baixo
    const lowStock = ingredients.filter(
      (i) => i.stockQuantity <= i.minimumStock
    ).length
    setLowStockItems(lowStock)

    // Dados para gráficos
    loadChartData(sales)
  }

  const loadChartData = (sales: Sale[]) => {
    // Gráfico de vendas diárias (últimos 7 dias)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date
    })

    const dailySalesCount = last7Days.map((date) => {
      date.setHours(0, 0, 0, 0)
      return sales.filter((s) => {
        const saleDate = new Date(s.date)
        saleDate.setHours(0, 0, 0, 0)
        return saleDate.getTime() === date.getTime()
      }).length
    })

    setDailyData({
      labels: last7Days.map((d) => d.toLocaleDateString('pt-BR')),
      datasets: [
        {
          label: 'Vendas por Dia',
          data: dailySalesCount,
          borderColor: '#8B4513',
          backgroundColor: 'rgba(139, 69, 19, 0.1)',
          tension: 0.3,
        },
      ],
    })

    // Gráfico de receita mensal
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (11 - i))
      return date
    })

    const monthlyRevenue = months.map((month) => {
      return sales
        .filter((s) => {
          const saleDate = new Date(s.date)
          return (
            saleDate.getMonth() === month.getMonth() &&
            saleDate.getFullYear() === month.getFullYear()
          )
        })
        .reduce((sum, s) => sum + s.totalPrice, 0)
    })

    setMonthlyData({
      labels: months.map((m) =>
        m.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      ),
      datasets: [
        {
          label: 'Receita (R$)',
          data: monthlyRevenue,
          backgroundColor: '#D2691E',
        },
      ],
    })
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Receita Hoje"
          value={`R$ ${todayRevenue.toFixed(2)}`}
          icon={<DollarSign size={24} />}
          color="success"
        />
        <StatCard
          label="Vendas Hoje"
          value={todaySales}
          icon={<ShoppingCart size={24} />}
          color="primary"
        />
        <StatCard
          label="Melhor Produto"
          value={bestSellingProduct}
          icon={<TrendingUp size={24} />}
          color="primary"
        />
        <StatCard
          label="Estoque Baixo"
          value={lowStockItems}
          icon={<AlertTriangle size={24} />}
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold mb-4 text-foreground">
            Vendas dos Últimos 7 Dias
          </h2>
          {dailyData && (
            <Line
              data={dailyData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          )}
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4 text-foreground">
            Receita por Mês
          </h2>
          {monthlyData && (
            <Bar
              data={monthlyData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          )}
        </Card>
      </div>
    </div>
  )
}
