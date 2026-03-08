'use client'

import { useEffect, useState } from 'react'
import { db, Ingredient } from '@/lib/database'
import { Card } from '@/components/Card'
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react'

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    costPerUnit: 0,
    stockQuantity: 0,
    minimumStock: 0,
    unit: 'kg',
  })

  useEffect(() => {
    loadIngredients()
  }, [])

  const loadIngredients = async () => {
    const data = await db.ingredients.toArray()
    setIngredients(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingId) {
      await db.ingredients.update(editingId, {
        ...formData,
      })
    } else {
      await db.ingredients.add({
        ...formData,
        createdAt: new Date(),
      })
    }

    resetForm()
    loadIngredients()
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja deletar este ingrediente?')) {
      await db.ingredients.delete(id)
      loadIngredients()
    }
  }

  const handleEdit = (ingredient: Ingredient) => {
    setFormData({
      name: ingredient.name,
      costPerUnit: ingredient.costPerUnit,
      stockQuantity: ingredient.stockQuantity,
      minimumStock: ingredient.minimumStock,
      unit: ingredient.unit,
    })
    setEditingId(ingredient.id || null)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      costPerUnit: 0,
      stockQuantity: 0,
      minimumStock: 0,
      unit: 'kg',
    })
    setEditingId(null)
    setShowForm(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-foreground">Ingredientes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary text-accent px-6 py-3 rounded-lg hover:bg-secondary transition-colors font-semibold"
        >
          <Plus size={20} />
          Novo Ingrediente
        </button>
      </div>

      {showForm && (
        <Card>
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            {editingId ? 'Editar Ingrediente' : 'Adicionar Ingrediente'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Nome do Ingrediente"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Custo por Unidade (R$)"
                step="0.01"
                value={formData.costPerUnit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    costPerUnit: parseFloat(e.target.value),
                  })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <select
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="l">L</option>
                <option value="ml">ml</option>
                <option value="un">Un</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Quantidade em Estoque"
                step="0.01"
                value={formData.stockQuantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stockQuantity: parseFloat(e.target.value),
                  })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <input
                type="number"
                placeholder="Estoque Mínimo"
                step="0.01"
                value={formData.minimumStock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minimumStock: parseFloat(e.target.value),
                  })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-primary text-accent px-4 py-2 rounded-lg hover:bg-secondary transition-colors font-semibold"
              >
                {editingId ? 'Atualizar' : 'Adicionar'}
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
        {ingredients.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Nenhum ingrediente cadastrado
            </p>
          </Card>
        ) : (
          ingredients.map((ing) => (
            <Card
              key={ing.id}
              className="flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">
                  {ing.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Custo: R$ {ing.costPerUnit.toFixed(2)} / {ing.unit}
                </p>
                <div className="mt-2 flex items-center gap-4">
                  <span className="text-sm">
                    Estoque: {ing.stockQuantity.toFixed(2)} {ing.unit}
                  </span>
                  <span className="text-sm">
                    Mínimo: {ing.minimumStock.toFixed(2)} {ing.unit}
                  </span>
                  {ing.stockQuantity <= ing.minimumStock && (
                    <span className="flex items-center gap-1 text-warning text-sm">
                      <AlertCircle size={16} />
                      Estoque baixo
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(ing)}
                  className="p-2 text-primary hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 size={20} />
                </button>
                <button
                  onClick={() => handleDelete(ing.id!)}
                  className="p-2 text-danger hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
