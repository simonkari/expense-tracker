"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { Alert } from "react-native"
import NetInfo from "@react-native-community/netinfo"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useAuth } from "./AuthContext"
import type { Category, Expense, Budget } from "../types/expense"
import * as expensesService from "../services/expensesService"

type OfflineChange = {
  type: "add" | "update" | "delete"
  collection: "expenses" | "categories" | "budgets"
  id?: string
  data?: any
}

type ExpenseContextType = {
  expenses: Expense[]
  categories: Category[]
  budgets: Budget[]
  loading: boolean
  addExpense: (expense: Omit<Expense, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateExpense: (id: string, expense: Partial<Omit<Expense, "id" | "createdAt" | "updatedAt">>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  addCategory: (category: Omit<Category, "id">) => Promise<void>
  updateCategory: (id: string, category: Partial<Omit<Category, "id">>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  addBudget: (budget: Omit<Budget, "id">) => Promise<void>
  updateBudget: (id: string, budget: Partial<Omit<Budget, "id">>) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
  syncOfflineData: () => Promise<void>
  exportData: (format: "csv" | "pdf") => Promise<string>
  isOnline: boolean
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined)

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [offlineChanges, setOfflineChanges] = useState<OfflineChange[]>([])

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected ?? false
      setIsOnline(online)

      // If we're back online, sync offline changes
      if (online && offlineChanges.length > 0) {
        syncOfflineData()
      }
    })

    return () => unsubscribe()
  }, [offlineChanges])

  // Load offline changes from AsyncStorage
  useEffect(() => {
    const loadOfflineChanges = async () => {
      try {
        const storedChanges = await AsyncStorage.getItem("offlineChanges")
        if (storedChanges) {
          setOfflineChanges(JSON.parse(storedChanges))
        }
      } catch (error) {
        console.error("Error loading offline changes:", error)
      }
    }

    loadOfflineChanges()
  }, [])

  // Subscribe to Firestore data when user is authenticated
  useEffect(() => {
    if (!user) {
      setExpenses([])
      setCategories([])
      setBudgets([])
      setLoading(false)
      return
    }

    setLoading(true)

    // Initialize default categories if needed
    expensesService.initializeDefaultCategories(user.uid).catch(console.error)

    // Set up subscriptions
    const unsubscribeExpenses = expensesService.subscribeToExpenses(user.uid, (data) => {
      setExpenses(data)
      // Save to AsyncStorage for offline access
      AsyncStorage.setItem("expenses", JSON.stringify(data)).catch(console.error)
    })

    const unsubscribeCategories = expensesService.subscribeToCategories(user.uid, (data) => {
      setCategories(data)
      // Save to AsyncStorage for offline access
      AsyncStorage.setItem("categories", JSON.stringify(data)).catch(console.error)
    })

    const unsubscribeBudgets = expensesService.subscribeToBudgets(user.uid, (data) => {
      setBudgets(data)
      // Save to AsyncStorage for offline access
      AsyncStorage.setItem("budgets", JSON.stringify(data)).catch(console.error)
    })

    setLoading(false)

    // Clean up subscriptions
    return () => {
      unsubscribeExpenses()
      unsubscribeCategories()
      unsubscribeBudgets()
    }
  }, [user])

  // Load data from AsyncStorage when offline
  const loadFromAsyncStorage = async () => {
    try {
      const expensesData = await AsyncStorage.getItem("expenses")
      const categoriesData = await AsyncStorage.getItem("categories")
      const budgetsData = await AsyncStorage.getItem("budgets")

      if (expensesData) setExpenses(JSON.parse(expensesData))
      if (categoriesData) setCategories(JSON.parse(categoriesData))
      if (budgetsData) setBudgets(JSON.parse(budgetsData))
    } catch (error) {
      console.error("Error loading from AsyncStorage:", error)
    }
  }

  // Add expense
  const addExpense = async (expense: Omit<Expense, "id" | "createdAt" | "updatedAt">) => {
    if (!user) return

    if (isOnline) {
      try {
        await expensesService.addExpense(user.uid, expense)
      } catch (error: any) {
        console.error("Error adding expense:", error)
        Alert.alert("Error", "Failed to add expense")
        throw error
      }
    } else {
      // Store offline changes
      const offlineChange: OfflineChange = {
        type: "add",
        collection: "expenses",
        data: expense,
      }

      const updatedChanges = [...offlineChanges, offlineChange]
      setOfflineChanges(updatedChanges)
      await AsyncStorage.setItem("offlineChanges", JSON.stringify(updatedChanges))

      // Update local state
      const tempId = `temp-${Date.now()}`
      setExpenses([
        {
          id: tempId,
          ...expense,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        ...expenses,
      ])

      Alert.alert("Offline Mode", "Expense saved locally and will sync when online")
    }
  }

  // Update expense
  const updateExpense = async (id: string, expense: Partial<Omit<Expense, "id" | "createdAt" | "updatedAt">>) => {
    if (!user) return

    if (isOnline) {
      try {
        await expensesService.updateExpense(user.uid, id, expense)
      } catch (error: any) {
        console.error("Error updating expense:", error)
        Alert.alert("Error", "Failed to update expense")
        throw error
      }
    } else {
      // Store offline changes
      const offlineChange: OfflineChange = {
        type: "update",
        collection: "expenses",
        id,
        data: expense,
      }

      const updatedChanges = [...offlineChanges, offlineChange]
      setOfflineChanges(updatedChanges)
      await AsyncStorage.setItem("offlineChanges", JSON.stringify(updatedChanges))

      // Update local state
      setExpenses(expenses.map((exp) => (exp.id === id ? { ...exp, ...expense, updatedAt: new Date() } : exp)))

      Alert.alert("Offline Mode", "Expense updated locally and will sync when online")
    }
  }

  // Delete expense
  const deleteExpense = async (id: string) => {
    if (!user) return

    if (isOnline) {
      try {
        await expensesService.deleteExpense(user.uid, id)
      } catch (error: any) {
        console.error("Error deleting expense:", error)
        Alert.alert("Error", "Failed to delete expense")
        throw error
      }
    } else {
      // Store offline changes
      const offlineChange: OfflineChange = {
        type: "delete",
        collection: "expenses",
        id,
      }

      const updatedChanges = [...offlineChanges, offlineChange]
      setOfflineChanges(updatedChanges)
      await AsyncStorage.setItem("offlineChanges", JSON.stringify(updatedChanges))

      // Update local state
      setExpenses(expenses.filter((exp) => exp.id !== id))

      Alert.alert("Offline Mode", "Expense deleted locally and will sync when online")
    }
  }

  // Add category
  const addCategory = async (category: Omit<Category, "id">) => {
    if (!user) return

    if (isOnline) {
      try {
        await expensesService.addCategory(user.uid, category)
      } catch (error: any) {
        console.error("Error adding category:", error)
        Alert.alert("Error", "Failed to add category")
        throw error
      }
    } else {
      // Store offline changes
      const offlineChange: OfflineChange = {
        type: "add",
        collection: "categories",
        data: category,
      }

      const updatedChanges = [...offlineChanges, offlineChange]
      setOfflineChanges(updatedChanges)
      await AsyncStorage.setItem("offlineChanges", JSON.stringify(updatedChanges))

      // Update local state
      const tempId = `temp-${Date.now()}`
      setCategories([...categories, { id: tempId, ...category }])

      Alert.alert("Offline Mode", "Category saved locally and will sync when online")
    }
  }

  // Update category
  const updateCategory = async (id: string, category: Partial<Omit<Category, "id">>) => {
    if (!user) return

    if (isOnline) {
      try {
        await expensesService.updateCategory(user.uid, id, category)
      } catch (error: any) {
        console.error("Error updating category:", error)
        Alert.alert("Error", "Failed to update category")
        throw error
      }
    } else {
      // Store offline changes
      const offlineChange: OfflineChange = {
        type: "update",
        collection: "categories",
        id,
        data: category,
      }

      const updatedChanges = [...offlineChanges, offlineChange]
      setOfflineChanges(updatedChanges)
      await AsyncStorage.setItem("offlineChanges", JSON.stringify(updatedChanges))

      // Update local state
      setCategories(categories.map((cat) => (cat.id === id ? { ...cat, ...category } : cat)))

      Alert.alert("Offline Mode", "Category updated locally and will sync when online")
    }
  }

  // Delete category
  const deleteCategory = async (id: string) => {
    if (!user) return

    if (isOnline) {
      try {
        await expensesService.deleteCategory(user.uid, id)
      } catch (error: any) {
        console.error("Error deleting category:", error)
        Alert.alert("Error", "Failed to delete category")
        throw error
      }
    } else {
      // Store offline changes
      const offlineChange: OfflineChange = {
        type: "delete",
        collection: "categories",
        id,
      }

      const updatedChanges = [...offlineChanges, offlineChange]
      setOfflineChanges(updatedChanges)
      await AsyncStorage.setItem("offlineChanges", JSON.stringify(updatedChanges))

      // Update local state
      setCategories(categories.filter((cat) => cat.id !== id))

      Alert.alert("Offline Mode", "Category deleted locally and will sync when online")
    }
  }

  // Add budget
  const addBudget = async (budget: Omit<Budget, "id">) => {
    if (!user) return

    if (isOnline) {
      try {
        await expensesService.addBudget(user.uid, budget)
      } catch (error: any) {
        console.error("Error adding budget:", error)
        Alert.alert("Error", "Failed to add budget")
        throw error
      }
    } else {
      // Store offline changes
      const offlineChange: OfflineChange = {
        type: "add",
        collection: "budgets",
        data: budget,
      }

      const updatedChanges = [...offlineChanges, offlineChange]
      setOfflineChanges(updatedChanges)
      await AsyncStorage.setItem("offlineChanges", JSON.stringify(updatedChanges))

      // Update local state
      const tempId = `temp-${Date.now()}`
      setBudgets([...budgets, { id: tempId, ...budget }])

      Alert.alert("Offline Mode", "Budget saved locally and will sync when online")
    }
  }

  // Update budget
  const updateBudget = async (id: string, budget: Partial<Omit<Budget, "id">>) => {
    if (!user) return

    if (isOnline) {
      try {
        await expensesService.updateBudget(user.uid, id, budget)
      } catch (error: any) {
        console.error("Error updating budget:", error)
        Alert.alert("Error", "Failed to update budget")
        throw error
      }
    } else {
      // Store offline changes
      const offlineChange: OfflineChange = {
        type: "update",
        collection: "budgets",
        id,
        data: budget,
      }

      const updatedChanges = [...offlineChanges, offlineChange]
      setOfflineChanges(updatedChanges)
      await AsyncStorage.setItem("offlineChanges", JSON.stringify(updatedChanges))

      // Update local state
      setBudgets(budgets.map((bud) => (bud.id === id ? { ...bud, ...budget } : bud)))

      Alert.alert("Offline Mode", "Budget updated locally and will sync when online")
    }
  }

  // Delete budget
  const deleteBudget = async (id: string) => {
    if (!user) return

    if (isOnline) {
      try {
        await expensesService.deleteBudget(user.uid, id)
      } catch (error: any) {
        console.error("Error deleting budget:", error)
        Alert.alert("Error", "Failed to delete budget")
        throw error
      }
    } else {
      // Store offline changes
      const offlineChange: OfflineChange = {
        type: "delete",
        collection: "budgets",
        id,
      }

      const updatedChanges = [...offlineChanges, offlineChange]
      setOfflineChanges(updatedChanges)
      await AsyncStorage.setItem("offlineChanges", JSON.stringify(updatedChanges))

      // Update local state
      setBudgets(budgets.filter((bud) => bud.id !== id))

      Alert.alert("Offline Mode", "Budget deleted locally and will sync when online")
    }
  }

  // Sync offline data
  const syncOfflineData = async () => {
    if (!user || !isOnline || offlineChanges.length === 0) return

    try {
      for (const change of offlineChanges) {
        if (change.type === "add") {
          if (change.collection === "expenses") {
            await expensesService.addExpense(user.uid, change.data)
          } else if (change.collection === "categories") {
            await expensesService.addCategory(user.uid, change.data)
          } else if (change.collection === "budgets") {
            await expensesService.addBudget(user.uid, change.data)
          }
        } else if (change.type === "update" && change.id) {
          if (change.collection === "expenses") {
            await expensesService.updateExpense(user.uid, change.id, change.data)
          } else if (change.collection === "categories") {
            await expensesService.updateCategory(user.uid, change.id, change.data)
          } else if (change.collection === "budgets") {
            await expensesService.updateBudget(user.uid, change.id, change.data)
          }
        } else if (change.type === "delete" && change.id) {
          if (change.collection === "expenses") {
            await expensesService.deleteExpense(user.uid, change.id)
          } else if (change.collection === "categories") {
            await expensesService.deleteCategory(user.uid, change.id)
          } else if (change.collection === "budgets") {
            await expensesService.deleteBudget(user.uid, change.id)
          }
        }
      }

      // Clear offline changes
      setOfflineChanges([])
      await AsyncStorage.removeItem("offlineChanges")

      Alert.alert("Sync Complete", "Your offline changes have been synced")
    } catch (error) {
      console.error("Error syncing offline data:", error)
      Alert.alert("Sync Error", "Failed to sync some offline changes")
    }
  }

  // Export data as CSV or PDF
  const exportData = async (format: "csv" | "pdf") => {
    if (!user) throw new Error("User not authenticated")

    if (format === "csv") {
      // Generate CSV
      let csv = "Date,Description,Category,Amount\n"

      expenses.forEach((expense) => {
        const date = expense.date.toISOString().split("T")[0]
        const description = expense.description.replace(/,/g, ";")
        const category = expense.category.name
        const amount = expense.amount.toFixed(2)

        csv += `${date},${description},${category},${amount}\n`
      })

      return csv
    } else if (format === "pdf") {
      // In a real app, we would generate a PDF
      // For this example, we'll just return a message
      return "PDF generation would happen here"
    }

    throw new Error("Invalid export format")
  }

  const value = {
    expenses,
    categories,
    budgets,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    addBudget,
    updateBudget,
    deleteBudget,
    syncOfflineData,
    exportData,
    isOnline,
  }

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>
}

export const useExpenses = () => {
  const context = useContext(ExpenseContext)
  if (context === undefined) {
    throw new Error("useExpenses must be used within an ExpenseProvider")
  }
  return context
}
