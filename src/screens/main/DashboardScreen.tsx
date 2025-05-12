"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { PieChart, LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { Plus, ArrowUpRight } from "lucide-react-native"
import { useExpenses } from "../../context/ExpenseContext"
import { useTheme } from "../../context/ThemeContext"
import { useAuth } from "../../context/AuthContext"

const screenWidth = Dimensions.get("window").width

export default function DashboardScreen() {
  const navigation = useNavigation()
  const { expenses, categories, budgets, loading } = useExpenses()
  const { currentTheme } = useTheme()
  const { user } = useAuth()
  const isDark = currentTheme === "dark"

  const [refreshing, setRefreshing] = useState(false)
  const [timeframe, setTimeframe] = useState("week") // week, month, year
  const [totalSpent, setTotalSpent] = useState(0)
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [monthlyData, setMonthlyData] = useState<any>({
    labels: [],
    datasets: [{ data: [] }],
  })

  // Calculate dashboard data
  useEffect(() => {
    if (loading) return

    // Calculate total spent
    const now = new Date()
    let filteredExpenses = [...expenses]

    if (timeframe === "week") {
      const weekAgo = new Date(now)
      weekAgo.setDate(now.getDate() - 7)
      filteredExpenses = expenses.filter((exp) => exp.date >= weekAgo)
    } else if (timeframe === "month") {
      const monthAgo = new Date(now)
      monthAgo.setMonth(now.getMonth() - 1)
      filteredExpenses = expenses.filter((exp) => exp.date >= monthAgo)
    } else if (timeframe === "year") {
      const yearAgo = new Date(now)
      yearAgo.setFullYear(now.getFullYear() - 1)
      filteredExpenses = expenses.filter((exp) => exp.date >= yearAgo)
    }

    const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    setTotalSpent(total)

    // Calculate category data for pie chart
    const categoryTotals: Record<string, number> = {}

    filteredExpenses.forEach((exp) => {
      const categoryId = exp.category.id
      if (categoryTotals[categoryId]) {
        categoryTotals[categoryId] += exp.amount
      } else {
        categoryTotals[categoryId] = exp.amount
      }
    })

    const pieData = Object.keys(categoryTotals).map((catId) => {
      const category = categories.find((c) => c.id === catId)
      return {
        name: category?.name || "Unknown",
        amount: categoryTotals[catId],
        color: category?.color || "#CCCCCC",
        legendFontColor: isDark ? "#FFFFFF" : "#7F7F7F",
        legendFontSize: 12,
      }
    })

    setCategoryData(pieData)

    // Calculate monthly data for line chart
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const monthlyTotals: number[] = Array(6).fill(0)
    const monthLabels: string[] = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthIndex = d.getMonth()
      const year = d.getFullYear()

      monthLabels.push(months[monthIndex])

      const monthlyExpenses = expenses.filter((exp) => {
        const expDate = exp.date
        return expDate.getMonth() === monthIndex && expDate.getFullYear() === year
      })

      monthlyTotals[5 - i] = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    }

    setMonthlyData({
      labels: monthLabels,
      datasets: [{ data: monthlyTotals }],
    })
  }, [expenses, categories, timeframe, loading, isDark])

  const onRefresh = () => {
    setRefreshing(true)
    // In a real app, you would fetch fresh data here
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }

  // Get current month's budget
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const currentBudget = budgets.find((b) => b.month === currentMonth && b.year === currentYear && !b.categoryId)

  const budgetAmount = currentBudget?.amount || 0
  const budgetPercentage = budgetAmount > 0 ? Math.min(100, (totalSpent / budgetAmount) * 100) : 0

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      <ScrollView className="flex-1" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className={`text-lg ${isDark ? "text-gray-300" : "text-gray-600"}`}>Welcome back,</Text>
              <Text className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
                {user?.displayName || "User"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("Add" as never)}
              className="bg-blue-500 rounded-full p-2"
            >
              <Plus size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Time Frame Selector */}
        <View className="flex-row justify-center space-x-2 mb-4">
          <TouchableOpacity
            onPress={() => setTimeframe("week")}
            className={`px-4 py-2 rounded-full ${
              timeframe === "week" ? "bg-blue-500" : isDark ? "bg-gray-800" : "bg-gray-200"
            }`}
          >
            <Text className={`${timeframe === "week" ? "text-white" : isDark ? "text-gray-300" : "text-gray-700"}`}>
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTimeframe("month")}
            className={`px-4 py-2 rounded-full ${
              timeframe === "month" ? "bg-blue-500" : isDark ? "bg-gray-800" : "bg-gray-200"
            }`}
          >
            <Text className={`${timeframe === "month" ? "text-white" : isDark ? "text-gray-300" : "text-gray-700"}`}>
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTimeframe("year")}
            className={`px-4 py-2 rounded-full ${
              timeframe === "year" ? "bg-blue-500" : isDark ? "bg-gray-800" : "bg-gray-200"
            }`}
          >
            <Text className={`${timeframe === "year" ? "text-white" : isDark ? "text-gray-300" : "text-gray-700"}`}>
              Year
            </Text>
          </TouchableOpacity>
        </View>

        {/* Total Spent Card */}
        <View className={`mx-6 p-6 rounded-xl ${isDark ? "bg-gray-800" : "bg-white"} shadow-sm mb-6`}>
          <Text className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Total Spent</Text>
          <Text className={`text-3xl font-bold mt-1 ${isDark ? "text-white" : "text-gray-800"}`}>
            ${totalSpent.toFixed(2)}
          </Text>

          {budgetAmount > 0 && (
            <View className="mt-4">
              <View className="flex-row justify-between mb-2">
                <Text className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Monthly Budget</Text>
                <Text className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  ${totalSpent.toFixed(2)} / ${budgetAmount.toFixed(2)}
                </Text>
              </View>
              <View className={`h-2 rounded-full w-full ${isDark ? "bg-gray-700" : "bg-gray-200"}`}>
                <View
                  className={`h-2 rounded-full ${budgetPercentage > 90 ? "bg-red-500" : "bg-blue-500"}`}
                  style={{ width: `${budgetPercentage}%` }}
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={() => navigation.navigate("Budget" as never)}
            className="flex-row items-center mt-4"
          >
            <Text className="text-blue-500 mr-1">View Budget Details</Text>
            <ArrowUpRight size={16} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Spending by Category */}
        <View className={`mx-6 p-6 rounded-xl ${isDark ? "bg-gray-800" : "bg-white"} shadow-sm mb-6`}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>
              Spending by Category
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Analytics" as never)}
              className="flex-row items-center"
            >
              <Text className="text-blue-500 mr-1">More</Text>
              <ArrowUpRight size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          {categoryData.length > 0 ? (
            <PieChart
              data={categoryData}
              width={screenWidth - 60}
              height={180}
              chartConfig={{
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => (isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`),
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <View className="items-center justify-center h-40">
              <Text className={isDark ? "text-gray-400" : "text-gray-500"}>No data available</Text>
            </View>
          )}
        </View>

        {/* Monthly Spending Trend */}
        <View className={`mx-6 p-6 rounded-xl ${isDark ? "bg-gray-800" : "bg-white"} shadow-sm mb-6`}>
          <Text className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-800"}`}>
            Monthly Spending Trend
          </Text>

          <LineChart
            data={monthlyData}
            width={screenWidth - 60}
            height={220}
            chartConfig={{
              backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
              backgroundGradientFrom: isDark ? "#1F2937" : "#FFFFFF",
              backgroundGradientTo: isDark ? "#1F2937" : "#FFFFFF",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              labelColor: (opacity = 1) => (isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`),
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: "#3B82F6",
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>

        {/* Recent Transactions */}
        <View className={`mx-6 p-6 rounded-xl ${isDark ? "bg-gray-800" : "bg-white"} shadow-sm mb-6`}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>
              Recent Transactions
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Expenses" as never)}
              className="flex-row items-center"
            >
              <Text className="text-blue-500 mr-1">View All</Text>
              <ArrowUpRight size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          {expenses.slice(0, 5).map((expense) => (
            <TouchableOpacity
              key={expense.id}
              onPress={() => navigation.navigate("ExpenseDetail" as never, { id: expense.id } as never)}
              className={`flex-row items-center justify-between py-3 border-b ${
                isDark ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <View className="flex-row items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: expense.category.color }}
                >
                  <Text className="text-white text-lg">{expense.category.name.charAt(0)}</Text>
                </View>
                <View>
                  <Text className={`font-medium ${isDark ? "text-white" : "text-gray-800"}`}>
                    {expense.description}
                  </Text>
                  <Text className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {expense.date.toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <Text className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>
                ${expense.amount.toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))}

          {expenses.length === 0 && (
            <View className="items-center justify-center py-6">
              <Text className={isDark ? "text-gray-400" : "text-gray-500"}>No transactions yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
