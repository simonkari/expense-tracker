export type Category = {
  id: string
  name: string
  color: string
  icon: string
}

export type Expense = {
  id: string
  amount: number
  description: string
  category: Category
  date: Date
  createdAt: Date
  updatedAt: Date
}

export type Budget = {
  id: string
  amount: number
  month: number
  year: number
  categoryId?: string
}
