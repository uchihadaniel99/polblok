'use client'

import { useEffect, useState } from 'react'
import { db, Production, Product, Ingredient } from '@/lib/database'
import { Card } from '@/components/Card'
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
  ChefHat,
} from 'lucide-react'

export default function ProductionPage() {
  const [productions, setProductions] = useState<Production[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    productId: 0,
    quantity: 0,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const prodData = await db.productions.toArray()
    const prodProducts = await db.products.toArray()
    const prodIngredients = await db.ingredients.toArray()
    setProductions(prodData)
    setProducts(prodProducts)
    setIngredients(prodIngredients)
  }

  const calculateIngredientsNeeded = (productId: number, quantity: number) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return []

    return product.ingredients.map((ing) => {
      const ingredient = ingredients.find((i) => i.id === ing.ingredientId)
      return {
        name: ingredient?.name || 'Desconhecido',
        needed: ing.quantity * quantity,
        unit: ingredient?.unit || '',
        available: ingredient?.stockQuantity || 0,
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const product = products.find((p) => p.id === formData.productId)
    if (!product) return

    if (editingId) {
      await db.productions.update(editingId, {
        productId: formData.productId,
        productName: product.name,
        quantity: formData.quantity,
        date: new Date(formData.date),
      })
    } else {
      await db.productions.add({
        productId: formData.productId,
        productName: product.name,
        quantity: formData.quantity,
        date: new Date(formData.date),
        completed: false,
      })
    }

    resetForm()
    loadData()
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja deletar este planejamento?')) {
      await db.productions.delete(id)
      loadData()
    }
  }

  const handleToggleCompleted = async (id: number, completed: boolean) => {
    await db.productions.update(id, { completed: !completed })
    loadData()
  }

  const handleEdit = (prod: Production) => {
    const date = new Date(prod.date)
    const dateString = date.toISOString().split('T')[0]

    setFormData({
      productId: prod.productId,
      quantity: prod.quantity,
      date: dateString,
    })
    setEditingId(prod.id || null)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      productId: 0,
      quantity: 0,
      date: new Date().toISOString().split('T')[0],
    })
    setEditingId(null)
    setShowForm(false)
  }

  const todayProductions = productions.filter((p) => {
    const prodDate = new Date(p.date)
    const today = new Date()
    return (
      prodDate.getDate() === today.getDate() &&
      prodDate.getMonth() === today.getMonth() &&
      prodDate.getFullYear() === today.getFullYear()
    )
  })

  const completedToday = todayProductions.filter((p) => p.completed).length

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-foreground">Planejamento de Produção</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary text-accent px-6 py-3 rounded-lg hover:bg-secondary transition-colors font-semibold"
        >
          <Plus size={20} />
          Novo Planejamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Produções Hoje</p>
              <p className="text-3xl font-bold text-foreground">{todayProductions.length}</p>
            </div>
            <ChefHat size={32} className="text-primary" />
          </div>
        </Card>
        <Card className="border-l-4 border-l-success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Concluídas Hoje</p>
              <p className="text-3xl font-bold text-foreground">{completedToday}</p>
            </div>
            <CheckCircle2 size={32} className="text-success" />
          </div>
        </Card>
      </div>

      {showForm && (
        <Card>
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            {editingId ? 'Editar Produção' : 'Novo Planejamento'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Produto</label>
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
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Quantidade
              </label>
              <input
                type="number"
                placeholder="Quantidade a produzir"
                step="0.01"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseFloat(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Data</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {formData.productId > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-foreground">
                  Ingredientes Necessários
                </h3>
                <div className="space-y-2">
                  {calculateIngredientsNeeded(
                    formData.productId,
                    formData.quantity
                  ).map((ing, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-sm">
                        {ing.name} ({ing.unit})
                      </span>
                      <div className="text-right">
                        <span className="font-semibold">
                          {ing.needed.toFixed(2)} {ing.unit}
                        </span>
                        <span
                          className={`text-xs ml-2 ${
                            ing.available >= ing.needed
                              ? 'text-success'
                              : 'text-danger'
                          }`}
                        >
                          (Disp: {ing.available.toFixed(2)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-primary text-accent px-4 py-2 rounded-lg hover:bg-secondary transition-colors font-semibold"
              >
                {editingId ? 'Atualizar' : 'Criar Planejamento'}
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
        {productions.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Nenhum planejamento de produção
            </p>
          </Card>
        ) : (
          productions.map((prod) => {
            const ingredientsNeeded = calculateIngredientsNeeded(
              prod.productId,
              prod.quantity
            )
            const hasEnoughIngredients = ingredientsNeeded.every(
              (ing) => ing.available >= ing.needed
            )

            return (
              <Card
                key={prod.id}
                className={`hover:shadow-md transition-all ${
                  prod.completed ? 'bg-gray-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {prod.productName}
                    </h3>
                    <div className="flex items-center gap-4 text-sm mb-3">
                      <span className="text-gray-600">
                        Qtd: {prod.quantity}
                      </span>
                      <span className="flex items-center gap-1 text-gray-600">
                        <Calendar size={16} />
                        {new Date(prod.date).toLocaleDateString('pt-BR')}
                      </span>
                      {!hasEnoughIngredients && (
                        <span className="px-2 py-1 bg-warning text-white rounded text-xs font-semibold">
                          Ingredientes insuficientes
                        </span>
                      )}
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs font-semibold mb-2 text-gray-700">
                        Ingredientes:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {ingredientsNeeded.map((ing, idx) => (
                          <span
                            key={idx}
                            className={`text-xs ${
                              ing.available >= ing.needed
                                ? 'text-gray-600'
                                : 'text-danger font-semibold'
                            }`}
                          >
                            {ing.name}: {ing.needed.toFixed(2)} / {ing.available.toFixed(2)}{' '}
                            {ing.unit}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() =>
                        handleToggleCompleted(prod.id!, prod.completed)
                      }
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        prod.completed
                          ? 'bg-success text-white'
                          : 'bg-gray-200 text-foreground hover:bg-gray-300'
                      }`}
                    >
                      {prod.completed ? '✓ Concluída' : 'Marcar Concluída'}
                    </button>
                    <button
                      onClick={() => handleEdit(prod)}
                      className="p-2 text-primary hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(prod.id!)}
                      className="p-2 text-danger hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
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
