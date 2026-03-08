'use client'

import { useEffect, useState } from 'react'
import { db, Sale } from '@/lib/database'
import { Card, StatCard } from '@/components/Card'
import { BarChart, PieChart, Download } from 'lucide-react'
import { Bar, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

export default function ReportsPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [monthYear, setMonthYear] = useState(
    new Date().toISOString().slice(0, 7)
  )
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalSales, setTotalSales] = useState(0)
  const [estimatedProfit, setEstimatedProfit] = useState(0)
  const [productSalesData, setProductSalesData] = useState<any>(null)
  const [dailyRevenueData, setDailyRevenueData] = useState<any>(null)

  useEffect(() => {
    loadReportData()
  }, [monthYear])

  const loadReportData = async () => {
    const allSales = await db.sales.toArray()

    // Filtrar por mês
    const [year, month] = monthYear.split('-').map(Number)
    const monthSales = allSales.filter((s) => {
      const saleDate = new Date(s.date)
      return (
        saleDate.getFullYear() === year && saleDate.getMonth() === month - 1
      )
    })

    setSales(monthSales)

    // Calcular totais
    const revenue = monthSales.reduce((sum, s) => sum + s.totalPrice, 0)
    setTotalRevenue(revenue)
    setTotalSales(monthSales.length)

    // Estimar lucro (assumindo margem média de 40%)
    const profit = revenue * 0.4
    setEstimatedProfit(profit)

    // Preparar dados para gráficos
    loadChartData(monthSales)
  }

  const loadChartData = (monthSales: Sale[]) => {
    // Gráfico de vendas por produto
    const productSales = monthSales.reduce(
      (acc, s) => {
        acc[s.productName] = (acc[s.productName] || 0) + s.quantity
        return acc
      },
      {} as Record<string, number>
    )

    const productColors = [
      '#8B4513',
      '#D2691E',
      '#CD853F',
      '#DEB887',
      '#A0522D',
    ]

    setProductSalesData({
      labels: Object.keys(productSales),
      datasets: [
        {
          label: 'Quantidade Vendida',
          data: Object.values(productSales),
          backgroundColor: Object.keys(productSales).map(
            (_, i) => productColors[i % productColors.length]
          ),
          borderColor: '#fff',
          borderWidth: 2,
        },
      ],
    })

    // Gráfico de receita diária
    const dailyRevenue = monthSales.reduce(
      (acc, s) => {
        const date = new Date(s.date).toLocaleDateString('pt-BR')
        acc[date] = (acc[date] || 0) + s.totalPrice
        return acc
      },
      {} as Record<string, number>
    )

    const sortedDates = Object.keys(dailyRevenue).sort((a, b) => {
      const dateA = new Date(a.split('/').reverse().join('-'))
      const dateB = new Date(b.split('/').reverse().join('-'))
      return dateA.getTime() - dateB.getTime()
    })

    setDailyRevenueData({
      labels: sortedDates,
      datasets: [
        {
          label: 'Receita (R$)',
          data: sortedDates.map((date) => dailyRevenue[date]),
          backgroundColor: '#D2691E',
          borderColor: '#8B4513',
          borderWidth: 1,
        },
      ],
    })
  }

  const handleExportCSV = () => {
    if (sales.length === 0) {
      alert('Nenhuma venda para exportar')
      return
    }

    const csv = [
      ['Produto', 'Quantidade', 'Preço Unitário', 'Total', 'Data/Hora'],
      ...sales.map((s) => [
        s.productName,
        s.quantity,
        `R$ ${s.salePrice.toFixed(2)}`,
        `R$ ${s.totalPrice.toFixed(2)}`,
        new Date(s.date).toLocaleString('pt-BR'),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio_${monthYear}.csv`
    a.click()
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-foreground">Relatórios</h1>

      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Período
          </label>
          <input
            type="month"
            value={monthYear}
            onChange={(e) => setMonthYear(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-success text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
        >
          <Download size={20} />
          Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Receita Total"
          value={`R$ ${totalRevenue.toFixed(2)}`}
          color="success"
        />
        <StatCard
          label="Total de Vendas"
          value={totalSales}
          color="primary"
        />
        <StatCard
          label="Lucro Estimado (40%)"
          value={`R$ ${estimatedProfit.toFixed(2)}`}
          color="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {productSalesData && (
          <Card>
            <h2 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
              <PieChart size={24} className="text-primary" />
              Vendas por Produto
            </h2>
            <Pie
              data={productSalesData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </Card>
        )}

        {dailyRevenueData && (
          <Card>
            <h2 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
              <BarChart size={24} className="text-primary" />
              Receita Diária
            </h2>
            <Bar
              data={dailyRevenueData}
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
          </Card>
        )}
      </div>

      {/* Tabela de Vendas Detalhadas */}
      <Card>
        <h2 className="text-2xl font-bold mb-4 text-foreground">
          Vendas do Período
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Produto
                </th>
                <th className="px-4 py-2 text-center text-sm font-semibold">
                  Quantidade
                </th>
                <th className="px-4 py-2 text-right text-sm font-semibold">
                  Preço Unit.
                </th>
                <th className="px-4 py-2 text-right text-sm font-semibold">
                  Total
                </th>
                <th className="px-4 py-2 text-center text-sm font-semibold">
                  Data
                </th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                    Nenhuma venda neste período
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{sale.productName}</td>
                    <td className="px-4 py-3 text-center">{sale.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      R$ {sale.salePrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      R$ {sale.totalPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {new Date(sale.date).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
