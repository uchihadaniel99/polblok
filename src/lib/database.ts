import Dexie, { Table } from 'dexie'

export interface Ingredient {
  id?: number
  name: string
  costPerUnit: number
  stockQuantity: number
  minimumStock: number
  unit: string
  createdAt: Date
}

export interface Product {
  id?: number
  name: string
  image?: string
  ingredients: {
    ingredientId: number
    quantity: number
  }[]
  costPrice: number
  profitMargin: number
  salePrice: number
  createdAt: Date
}

export interface Sale {
  id?: number
  productId: number
  productName: string
  quantity: number
  salePrice: number
  totalPrice: number
  date: Date
}

export interface Order {
  id?: number
  customerName: string
  productId: number
  productName: string
  pickupDate: Date
  status: 'pendente' | 'em_producao' | 'pronto' | 'entregue'
  notes?: string
  createdAt: Date
}

export interface Production {
  id?: number
  productId: number
  productName: string
  quantity: number
  date: Date
  completed: boolean
}

export class CafeteriaDB extends Dexie {
  ingredients!: Table<Ingredient>
  products!: Table<Product>
  sales!: Table<Sale>
  orders!: Table<Order>
  productions!: Table<Production>

  constructor() {
    super('CafeteriaDB')
    this.version(1).stores({
      ingredients: '++id, name',
      products: '++id, name',
      sales: '++id, date',
      orders: '++id, createdAt, status',
      productions: '++id, date',
    })
  }
}

export const db = new CafeteriaDB()
