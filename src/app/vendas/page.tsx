'use client'

import { useEffect, useState } from 'react'
import { db, Product, Sale, Ingredient } from '@/lib/database'
import { Card } from '@/components/Card'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  Clock,
} from 'lucide-react'

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<
    { productId: number; quantity: number; salePrice: number; productName: string }[]
  >([])
  const [todaySales, setTodaySales] = useState<Sale[]>([])
  const [showFinalize, setShowFinalize] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('dinheiro')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const prods = await db.products.toArray()
    setProducts(prods)
    loadTodaySales()
  }

  const loadTodaySales = async () => {
    const sales = await db.sales.toArray()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayData = sales.filter((s) => {
      const saleDate = new Date(s.date)
      saleDate.setHours(0, 0, 0, 0)
      return saleDate.getTime() === today.getTime()
    })
    setTodaySales(todayData)
  }

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.productId === product.id)

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
    } else {
      setCart([
        ...cart,
        {
          productId: product.id!,
          quantity: 1,
          salePrice: product.salePrice,
          productName: product.name,
        },
      ])
    }
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(
        cart.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        )
      )
    }
  }

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.productId !== productId))
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.salePrice * item.quantity, 0)
  }

  const handleFinalizeSale = async () => {
    if (cart.length === 0) return

    try {
      // Adicionar vendas ao banco de dados
      for (const item of cart) {
        const sale: Sale = {
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          salePrice: item.salePrice,
          totalPrice: item.salePrice * item.quantity,
          date: new Date(),
        }
        await db.sales.add(sale)

        // Reduzir estoque dos ingredientes
        const product = products.find((p) => p.id === item.productId)
        if (product) {
          for (const ingredient of product.ingredients) {
            const ing = await db.ingredients.get(ingredient.ingredientId)
            if (ing) {
              const newStock = ing.stockQuantity - ingredient.quantity * item.quantity
              await db.ingredients.update(ingredient.ingredientId, {
                stockQuantity: newStock,
              })
            }
          }
        }
      }

      // Limpar carrinho e recarregar dados
      setCart([])
      setPaymentMethod('dinheiro')
      setShowFinalize(false)
      loadData()
      alert('Venda finalizada com sucesso!')
    } catch (error) {
      console.error('Erro ao finalizar venda:', error)
      alert('Erro ao finalizar venda')
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-foreground">Sistema de Vendas (POS)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Produtos */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <h2 className="text-2xl font-bold mb-6 text-foreground">
              Produtos Disponíveis
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.length === 0 ? (
                <p className="text-gray-500 col-span-2">
                  Nenhum produto cadastrado
                </p>
              ) : (
                products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-primary transition-all hover:shadow-md"
                  >
                    <h3 className="font-semibold text-foreground mb-2">
                      {product.name}
                    </h3>
                    <p className="text-2xl font-bold text-success mb-2">
                      R$ {product.salePrice.toFixed(2)}
                    </p>
                    <span className="text-xs text-gray-600">
                      Clique para adicionar
                    </span>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Carrinho e Resumo */}
        <div className="space-y-4">
          <Card className="sticky top-32">
            <div className="flex items-center gap-2 mb-6">
              <ShoppingCart size={24} className="text-primary" />
              <h2 className="text-xl font-bold text-foreground">Carrinho</h2>
            </div>

            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Carrinho vazio
              </p>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="bg-gray-50 p-3 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm text-foreground">
                          {item.productName}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-danger hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="flex-1 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="text-right text-sm mt-2">
                        R$ {(item.salePrice * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-success">
                      R$ {getTotalPrice().toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowFinalize(!showFinalize)}
                    className="w-full bg-primary text-accent px-4 py-3 rounded-lg hover:bg-secondary transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} />
                    Finalizar Venda
                  </button>
                </div>
              </>
            )}
          </Card>

          {/* Formulário de Pagamento */}
          {showFinalize && cart.length > 0 && (
            <Card className="border-2 border-warning">
              <h3 className="font-semibold mb-4 text-foreground">
                Forma de Pagamento
              </h3>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="dinheiro">Dinheiro</option>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
                <option value="pix">PIX</option>
              </select>
              <button
                onClick={handleFinalizeSale}
                className="w-full bg-success text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold mb-2"
              >
                Confirmar Pagamento
              </button>
              <button
                onClick={() => setShowFinalize(false)}
                className="w-full bg-gray-300 text-foreground px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </Card>
          )}
        </div>
      </div>

      {/* Vendas de Hoje */}
      <Card>
        <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
          <Clock size={24} className="text-primary" />
          Vendas de Hoje
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Produto
                </th>
                <th className="px-4 py-2 text-center text-sm font-semibold">
                  Qtd
                </th>
                <th className="px-4 py-2 text-right text-sm font-semibold">
                  Preço Unit.
                </th>
                <th className="px-4 py-2 text-right text-sm font-semibold">
                  Total
                </th>
                <th className="px-4 py-2 text-center text-sm font-semibold">
                  Horário
                </th>
              </tr>
            </thead>
            <tbody>
              {todaySales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                    Nenhuma venda hoje
                  </td>
                </tr>
              ) : (
                todaySales.map((sale) => (
                  <tr key={sale.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{sale.productName}</td>
                    <td className="px-4 py-3 text-center">{sale.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      R$ {sale.salePrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      R$ {sale.totalPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {new Date(sale.date).toLocaleTimeString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {todaySales.length > 0 && (
          <div className="mt-4 text-right">
            <p className="text-xl font-bold text-foreground">
              Total do Dia: R${' '}
              {todaySales
                .reduce((sum, s) => sum + s.totalPrice, 0)
                .toFixed(2)}
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
