'use client'

import { useEffect, useState } from 'react'
import { db, Order, Product } from '@/lib/database'
import { Card } from '@/components/Card'
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

type OrderStatus = 'pendente' | 'em_producao' | 'pronto' | 'entregue'

const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  pendente: { label: 'Pendente', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  em_producao: { label: 'Em Produção', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  pronto: { label: 'Pronto', color: 'text-green-600', bgColor: 'bg-green-100' },
  entregue: { label: 'Entregue', color: 'text-gray-600', bgColor: 'bg-gray-100' },
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    customerName: '',
    productId: 0,
    pickupDate: '',
    status: 'pendente' as OrderStatus,
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const orderData = await db.orders.toArray()
    const productData = await db.products.toArray()
    setOrders(orderData)
    setProducts(productData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const product = products.find((p) => p.id === formData.productId)
    if (!product) return

    if (editingId) {
      await db.orders.update(editingId, {
        customerName: formData.customerName,
        productId: formData.productId,
        productName: product.name,
        pickupDate: new Date(formData.pickupDate),
        status: formData.status,
        notes: formData.notes,
      })
    } else {
      await db.orders.add({
        customerName: formData.customerName,
        productId: formData.productId,
        productName: product.name,
        pickupDate: new Date(formData.pickupDate),
        status: formData.status,
        notes: formData.notes,
        createdAt: new Date(),
      })
    }

    resetForm()
    loadData()
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja deletar este pedido?')) {
      await db.orders.delete(id)
      loadData()
    }
  }

  const handleStatusChange = async (id: number, newStatus: OrderStatus) => {
    await db.orders.update(id, { status: newStatus })
    loadData()
  }

  const handleEdit = (order: Order) => {
    const date = new Date(order.pickupDate)
    const dateString = date.toISOString().split('T')[0]

    setFormData({
      customerName: order.customerName,
      productId: order.productId,
      pickupDate: dateString,
      status: order.status,
      notes: order.notes || '',
    })
    setEditingId(order.id || null)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      customerName: '',
      productId: 0,
      pickupDate: '',
      status: 'pendente',
      notes: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  const pendingOrders = orders.filter((o) => o.status === 'pendente').length
  const upcomingPickups = orders.filter((o) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const pickupDate = new Date(o.pickupDate)
    pickupDate.setHours(0, 0, 0, 0)
    return pickupDate <= today && o.status !== 'entregue'
  }).length

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-foreground">Pedidos</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary text-accent px-6 py-3 rounded-lg hover:bg-secondary transition-colors font-semibold"
        >
          <Plus size={20} />
          Novo Pedido
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pedidos Pendentes</p>
              <p className="text-3xl font-bold text-foreground">{pendingOrders}</p>
            </div>
            <AlertCircle size={32} className="text-yellow-500" />
          </div>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Retiradas Vencidas</p>
              <p className="text-3xl font-bold text-foreground">{upcomingPickups}</p>
            </div>
            <AlertCircle size={32} className="text-red-500" />
          </div>
        </Card>
      </div>

      {showForm && (
        <Card>
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            {editingId ? 'Editar Pedido' : 'Novo Pedido'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Nome do Cliente"
              value={formData.customerName}
              onChange={(e) =>
                setFormData({ ...formData, customerName: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />

            <select
              value={formData.productId}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  productId: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value={0}>Selecione um produto</option>
              {products.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={formData.pickupDate}
              onChange={(e) =>
                setFormData({ ...formData, pickupDate: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />

            <textarea
              placeholder="Notas / Observações"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-24"
            />

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-primary text-accent px-4 py-2 rounded-lg hover:bg-secondary transition-colors font-semibold"
              >
                {editingId ? 'Atualizar' : 'Criar Pedido'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-300 text-foreground px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
              >
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-500 text-lg">Nenhum pedido cadastrado</p>
          </Card>
        ) : (
          orders.map((order) => {
            const config = statusConfig[order.status]
            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {order.customerName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Produto: {order.productName}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Calendar size={16} />
                        {new Date(order.pickupDate).toLocaleDateString('pt-BR')}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.bgColor} ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    {order.notes && (
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-semibold">Notas:</span> {order.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(order.id!, e.target.value as OrderStatus)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {Object.entries(statusConfig).map(([value, { label }]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(order)}
                        className="p-2 text-primary hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(order.id!)}
                        className="p-2 text-danger hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
