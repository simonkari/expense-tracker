import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  type DocumentData,
  type QuerySnapshot,
  type Unsubscribe,
} from "firebase/firestore"
import { db } from "../config/firebase"
import type { Category, Expense, Budget } from "../types/expense"

/**
 * Get expenses collection reference for a user
 */
const getExpensesRef = (userId: string) => {
  return collection(db, "users", userId, "expenses")
}

/**
 * Get categories collection reference for a user
 */
const getCategoriesRef = (userId: string) => {
  return collection(db, "users", userId, "categories")
}

/**
 * Get budgets collection reference for a user
 */
const getBudgetsRef = (userId: string) => {
  return collection(db, "users", userId, "budgets")
}

/**
 * Convert Firestore timestamp to Date
 */
const convertTimestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate()
}

/**
 * Convert Firestore document to Expense object
 */
const convertDocToExpense = (doc: DocumentData): Expense => {
  const data = doc.data()
  return {
    id: doc.id,
    amount: data.amount,
    description: data.description,
    category: data.category,
    date: convertTimestampToDate(data.date),
    createdAt: convertTimestampToDate(data.createdAt),
    updatedAt: convertTimestampToDate(data.updatedAt),
  }
}

/**
 * Convert Firestore document to Category object
 */
const convertDocToCategory = (doc: DocumentData): Category => {
  const data = doc.data()
  return {
    id: doc.id,
    name: data.name,
    color: data.color,
    icon: data.icon,
  }
}

/**
 * Convert Firestore document to Budget object
 */
const convertDocToBudget = (doc: DocumentData): Budget => {
  const data = doc.data()
  return {
    id: doc.id,
    amount: data.amount,
    month: data.month,
    year: data.year,
    categoryId: data.categoryId,
  }
}

/**
 * Get all expenses for a user
 */
export const getExpenses = async (userId: string): Promise<Expense[]> => {
  try {
    const expensesQuery = query(getExpensesRef(userId), orderBy("date", "desc"))
    const querySnapshot = await getDocs(expensesQuery)

    return querySnapshot.docs.map(convertDocToExpense)
  } catch (error) {
    console.error("Error getting expenses:", error)
    throw error
  }
}

/**
 * Subscribe to expenses changes
 */
export const subscribeToExpenses = (userId: string, callback: (expenses: Expense[]) => void): Unsubscribe => {
  const expensesQuery = query(getExpensesRef(userId), orderBy("date", "desc"))

  return onSnapshot(expensesQuery, (querySnapshot: QuerySnapshot) => {
    const expenses = querySnapshot.docs.map(convertDocToExpense)
    callback(expenses)
  })
}

/**
 * Add a new expense
 */
export const addExpense = async (
  userId: string,
  expense: Omit<Expense, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  try {
    const expenseData = {
      ...expense,
      date: Timestamp.fromDate(expense.date),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(getExpensesRef(userId), expenseData)
    return docRef.id
  } catch (error) {
    console.error("Error adding expense:", error)
    throw error
  }
}

/**
 * Update an expense
 */
export const updateExpense = async (
  userId: string,
  expenseId: string,
  expenseData: Partial<Omit<Expense, "id" | "createdAt" | "updatedAt">>,
): Promise<void> => {
  try {
    const expenseRef = doc(getExpensesRef(userId), expenseId)

    const updateData: any = {
      ...expenseData,
      updatedAt: serverTimestamp(),
    }

    // Convert date to Timestamp if it exists
    if (expenseData.date) {
      updateData.date = Timestamp.fromDate(expenseData.date)
    }

    await updateDoc(expenseRef, updateData)
  } catch (error) {
    console.error("Error updating expense:", error)
    throw error
  }
}

/**
 * Delete an expense
 */
export const deleteExpense = async (userId: string, expenseId: string): Promise<void> => {
  try {
    const expenseRef = doc(getExpensesRef(userId), expenseId)
    await deleteDoc(expenseRef)
  } catch (error) {
    console.error("Error deleting expense:", error)
    throw error
  }
}

/**
 * Get all categories for a user
 */
export const getCategories = async (userId: string): Promise<Category[]> => {
  try {
    const categoriesQuery = query(getCategoriesRef(userId), orderBy("name"))
    const querySnapshot = await getDocs(categoriesQuery)

    return querySnapshot.docs.map(convertDocToCategory)
  } catch (error) {
    console.error("Error getting categories:", error)
    throw error
  }
}

/**
 * Subscribe to categories changes
 */
export const subscribeToCategories = (userId: string, callback: (categories: Category[]) => void): Unsubscribe => {
  const categoriesQuery = query(getCategoriesRef(userId), orderBy("name"))

  return onSnapshot(categoriesQuery, (querySnapshot: QuerySnapshot) => {
    const categories = querySnapshot.docs.map(convertDocToCategory)
    callback(categories)
  })
}

/**
 * Add a new category
 */
export const addCategory = async (userId: string, category: Omit<Category, "id">): Promise<string> => {
  try {
    const docRef = await addDoc(getCategoriesRef(userId), category)
    return docRef.id
  } catch (error) {
    console.error("Error adding category:", error)
    throw error
  }
}

/**
 * Update a category
 */
export const updateCategory = async (
  userId: string,
  categoryId: string,
  categoryData: Partial<Omit<Category, "id">>,
): Promise<void> => {
  try {
    const categoryRef = doc(getCategoriesRef(userId), categoryId)
    await updateDoc(categoryRef, categoryData)
  } catch (error) {
    console.error("Error updating category:", error)
    throw error
  }
}

/**
 * Delete a category
 */
export const deleteCategory = async (userId: string, categoryId: string): Promise<void> => {
  try {
    const categoryRef = doc(getCategoriesRef(userId), categoryId)
    await deleteDoc(categoryRef)
  } catch (error) {
    console.error("Error deleting category:", error)
    throw error
  }
}

/**
 * Get all budgets for a user
 */
export const getBudgets = async (userId: string): Promise<Budget[]> => {
  try {
    const budgetsQuery = query(getBudgetsRef(userId))
    const querySnapshot = await getDocs(budgetsQuery)

    return querySnapshot.docs.map(convertDocToBudget)
  } catch (error) {
    console.error("Error getting budgets:", error)
    throw error
  }
}

/**
 * Subscribe to budgets changes
 */
export const subscribeToBudgets = (userId: string, callback: (budgets: Budget[]) => void): Unsubscribe => {
  const budgetsQuery = query(getBudgetsRef(userId))

  return onSnapshot(budgetsQuery, (querySnapshot: QuerySnapshot) => {
    const budgets = querySnapshot.docs.map(convertDocToBudget)
    callback(budgets)
  })
}

/**
 * Add a new budget
 */
export const addBudget = async (userId: string, budget: Omit<Budget, "id">): Promise<string> => {
  try {
    const docRef = await addDoc(getBudgetsRef(userId), budget)
    return docRef.id
  } catch (error) {
    console.error("Error adding budget:", error)
    throw error
  }
}

/**
 * Update a budget
 */
export const updateBudget = async (
  userId: string,
  budgetId: string,
  budgetData: Partial<Omit<Budget, "id">>,
): Promise<void> => {
  try {
    const budgetRef = doc(getBudgetsRef(userId), budgetId)
    await updateDoc(budgetRef, budgetData)
  } catch (error) {
    console.error("Error updating budget:", error)
    throw error
  }
}

/**
 * Delete a budget
 */
export const deleteBudget = async (userId: string, budgetId: string): Promise<void> => {
  try {
    const budgetRef = doc(getBudgetsRef(userId), budgetId)
    await deleteDoc(budgetRef)
  } catch (error) {
    console.error("Error deleting budget:", error)
    throw error
  }
}

/**
 * Initialize default categories for a new user
 */
export const initializeDefaultCategories = async (userId: string): Promise<void> => {
  try {
    // Check if user already has categories
    const existingCategories = await getCategories(userId)
    if (existingCategories.length > 0) {
      return // User already has categories
    }

    // Default categories
    const defaultCategories = [
      { name: "Food", color: "#FF5733", icon: "utensils" },
      { name: "Transport", color: "#33FF57", icon: "car" },
      { name: "Entertainment", color: "#3357FF", icon: "film" },
      { name: "Shopping", color: "#F033FF", icon: "shopping-bag" },
      { name: "Bills", color: "#FF33A8", icon: "file-invoice" },
      { name: "Health", color: "#33FFF0", icon: "heartbeat" },
      { name: "Other", color: "#FFBD33", icon: "ellipsis-h" },
    ]

    // Add each category
    for (const category of defaultCategories) {
      await addCategory(userId, category)
    }
  } catch (error) {
    console.error("Error initializing default categories:", error)
    throw error
  }
}
