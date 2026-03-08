'use client'

import { useEffect, useState } from 'react'
import { db, Product, Ingredient } from '@/lib/database'
import { Card } from '@/components/Card'
import { Plus, Edit2, Trash2, ImageIcon } from 'lucide-react'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    ingredients: [] as { ingredientId: number; quantity: number }[],
    profitMargin: 30,
  })
  const [selectedIngredientsForAdd, setSelectedIngredientsForAdd] = useState({
    ingredientId: 0,
    quantity: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const prods = await db.products.toArray()
    const ings = await db.ingredients.toArray()
    setProducts(prods)
    setIngredients(ings)
  }

  const calculateCost = (ingredientsList: { ingredientId: number; quantity: number }[]) => {
    return ingredientsList.reduce((total, item) => {
      const ingredient = ingredients.find((i) => i.id === item.ingredientId)
      if (ingredient) {
        total += ingredient.costPerUnit * item.quantity
      }
      return total
    }, 0)
  }

  const calculatePrice = (cost: number, margin: number) => {
    return cost + cost * (margin / 100)
  }

  const handleAddIngredient = () => {
    if (selectedIngredientsForAdd.ingredientId > 0) {
      setFormData({
        ...formData,
        ingredients: [
          ...formData.ingredients,
          {
            ingredientId: selectedIngredientsForAdd.ingredientId,
            quantity: selectedIngredientsForAdd.quantity,
          },
        ],
      })
      setSelectedIngredientsForAdd({ ingredientId: 0, quantity: 0 })
    }
  }

  const handleRemoveIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const costPrice = calculateCost(formData.ingredients)
    const salePrice = calculatePrice(costPrice, formData.profitMargin)

    if (editingId) {
      await db.products.update(editingId, {
        name: formData.name,
        image: formData.image,
        ingredients: formData.ingredients,
        costPrice,
        profitMargin: formData.profitMargin,
        salePrice,
      })
    } else {
      await db.products.add({
        name: formData.name,
        image: formData.image,
        ingredients: formData.ingredients,
        costPrice,
        profitMargin: formData.profitMargin,
        salePrice,
        createdAt: new Date(),
      })
    }

    resetForm()
    loadData()
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja deletar este produto?')) {
      await db.products.delete(id)
      loadData()
    }
  }

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      image: product.image || '',
      ingredients: product.ingredients,
      profitMargin: product.profitMargin,
    })
    setEditingId(product.id || null)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      image: '',
      ingredients: [],
      profitMargin: 30,
    })
    setSelectedIngredientsForAdd({ ingredientId: 0, quantity: 0 })
    setEditingId(null)
    setShowForm(false)
  }

  const costPrice = calculateCost(formData.ingredients)
  const salePrice = calculatePrice(costPrice, formData.profitMargin)

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-foreground">Produtos</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary text-accent px-6 py-3 rounded-lg hover:bg-secondary transition-colors font-semibold"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      {showForm && (
        <Card>
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            {editingId ? 'Editar Produto' : 'Adicionar Produto'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Nome do Produto"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />

            <div>
              <label className="block text-sm font-semibold mb-2">
                URL da Imagem
              </label>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4 text-foreground">Ingredientes</h3>
              <div className="space-y-2 mb-4">
                {formData.ingredients.map((item, idx) => {
                  const ingredient = ingredients.find(
                    (i) => i.id === item.ingredientId
                  )
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                    >
                      <span>
                        {ingredient?.name} - {item.quantity} {ingredient?.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(idx)}
                        className="text-danger hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-2 mb-4">
                <select
                  value={selectedIngredientsForAdd.ingredientId}
                  onChange={(e) =>
                    setSelectedIngredientsForAdd({
                      ...selectedIngredientsForAdd,
                      ingredientId: parseInt(e.target.value),
                    })
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value={0}>Selecione um ingrediente</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Quantidade"
                  step="0.01"
                  value={selectedIngredientsForAdd.quantity}
                  onChange={(e) =>
                    setSelectedIngredientsForAdd({
                      ...selectedIngredientsForAdd,
                      quantity: parseFloat(e.target.value),
                    })
                  }
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  Adicionar
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Margem de Lucro (%)
              </label>
              <input
                type="number"
                placeholder="30"
                value={formData.profitMargin}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    profitMargin: parseFloat(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span>Custo do Produto:</span>
                <span className="font-semibold">R$ {costPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Preço de Venda:</span>
                <span className="font-semibold text-success">
                  R$ {salePrice.toFixed(2)}
                </span>
              </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.length === 0 ? (
          <Card className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">Nenhum produto cadastrado</p>
          </Card>
        ) : (
          products.map((product) => (
            <Card key={product.id} className="flex flex-col">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-40 object-cover rounded-lg mb-4"
                />
              ) : (
                <div className="w-full h-40 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                  <ImageIcon className="text-gray-400" size={40} />
                </div>
              )}
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {product.ingredients.length} ingredientes
              </p>
              <div className="flex-1"></div>
              <div className="border-t pt-4 mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Custo:</span>
                  <span className="font-semibold">R$ {product.costPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Venda:</span>
                  <span className="font-semibold text-success">
                    R$ {product.salePrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 p-2 text-primary hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={20} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id!)}
                    className="flex-1 p-2 text-danger hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={20} className="mx-auto" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
