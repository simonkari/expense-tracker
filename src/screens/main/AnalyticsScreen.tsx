"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { PieChart, BarChart, LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { Calendar } from "lucide-react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import { useExpenses } from "../../context/ExpenseContext"
import { useTheme } from "../../context/ThemeContext"

const screenWidth = Dimensions.get("window").width

export default function AnalyticsScreen() {
  const { expenses, categories } = useExpenses()
  const { currentTheme } = useTheme()
  const isDark = currentTheme === "dark"

  const [timeframe, setTimeframe] = useState("month") // week, month, year, custom
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    return date
  })
  const [endDate, setEndDate] = useState(new Date())
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [chartType, setChartType] = useState("pie") // pie, bar, line

  const [filteredExpenses, setFilteredExpenses] = useState(expenses)
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [barData, setBarData] = useState<any>({
    labels: [],
    datasets: [{ data: [] }],
  })
  const [lineData, setLineData] = useState<any>({
    labels: [],
    datasets: [{ data: [] }],
  })

  // Filter expenses based on timeframe
  useEffect(() => {
    const now = new Date()
    let filtered = [...expenses]
    const start = new Date()

    if (timeframe === "week") {
      start.setDate(now.getDate() - 7)
      filtered = expenses.filter((exp) => exp.date >= start)
    } else if (timeframe === "month") {
      start.setMonth(now.getMonth() - 1)
      filtered = expenses.filter((exp) => exp.date >= start)
    } else if (timeframe === "year") {
      start.setFullYear(now.getFullYear() - 1)
      filtered = expenses.filter((exp) => exp.date >= start)
    } else if (timeframe === "custom") {
      filtered = expenses.filter((exp) => exp.date >= startDate && exp.date <= endDate)
    }

    setFilteredExpenses(filtered)
  }, [expenses, timeframe, startDate, endDate])

  // Calculate chart data
  useEffect(() => {
    // Category data for pie chart
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

    // Bar chart data - top 5 categories
    const sortedCategories = [...pieData].sort((a, b) => b.amount - a.amount).slice(0, 5)

    setBarData({
      labels: sortedCategories.map((cat) => cat.name),
      datasets: [
        {
          data: sortedCategories.map((cat) => cat.amount),
          colors: sortedCategories.map((cat) => () => cat.color),
        },
      ],
    })

    // Line chart data - daily spending for the last 7 days
    const dailyData: Record<string, number> = {}
    const labels: string[] = []
    const data: number[] = []

    // Create date range for last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      dailyData[dateStr] = 0
      labels.push(date.getDate().toString())
    }

    // Sum expenses by day
    filteredExpenses.forEach((exp) => {
      const dateStr = exp.date.toISOString().split("T")[0]
      if (dailyData[dateStr] !== undefined) {
        dailyData[dateStr] += exp.amount
      }
    })

    // Convert to array for chart
    Object.keys(dailyData).forEach((date) => {
      data.push(dailyData[date])
    })

    setLineData({
      labels,
      datasets: [{ data }],
    })
  }, [filteredExpenses, categories, isDark])

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false)
    if (selectedDate) {
      setStartDate(selectedDate)
    }
  }

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false)
    if (selectedDate) {
      setEndDate(selectedDate)
    }
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      <View className="p-6">
        <Text className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}>Analytics</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Time Frame Selector */}
        <View className="px-6 mb-6">
          <Text className={`text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>Time Frame</Text>
          <View className="flex-row flex-wrap gap-2">
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
            <TouchableOpacity
              onPress={() => setTimeframe("custom")}
              className={`px-4 py-2 rounded-full ${
                timeframe === "custom" ? "bg-blue-500" : isDark ? "bg-gray-800" : "bg-gray-200"
              }`}
            >
              <Text className={`${timeframe === "custom" ? "text-white" : isDark ? "text-gray-300" : "text-gray-700"}`}>
                Custom
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Custom Date Range */}
        {timeframe === "custom" && (
          <View className="px-6 mb-6">
            <View className="flex-row justify-between">
              <View className="flex-1 mr-2">
                <Text className={`text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>Start Date</Text>
                <TouchableOpacity
                  onPress={() => setShowStartDatePicker(true)}
                  className={`flex-row items-center border rounded-lg px-4 py-3 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white"}`}
                >
                  <Calendar size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
                  <Text className={`ml-2 ${isDark ? "text-white" : "text-gray-800"}`}>
                    {startDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>

                {showStartDatePicker && (
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="default"
                    onChange={onStartDateChange}
                    maximumDate={endDate}
                  />
                )}
              </View>

              <View className="flex-1 ml-2">
                <Text className={`text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>End Date</Text>
                <TouchableOpacity
                  onPress={() => setShowEndDatePicker(true)}
                  className={`flex-row items-center border rounded-lg px-4 py-3 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white"}`}
                >
                  <Calendar size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
                  <Text className={`ml-2 ${isDark ? "text-white" : "text-gray-800"}`}>
                    {endDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>

                {showEndDatePicker && (
                  <DateTimePicker
                    value={endDate}
                    mode="date"
                    display="default"
                    onChange={onEndDateChange}
                    minimumDate={startDate}
                    maximumDate={new Date()}
                  />
                )}
              </View>
            </View>
          </View>
        )}

        {/* Chart Type Selector */}
        <View className="px-6 mb-6">
          <Text className={`text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>Chart Type</Text>
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setChartType("pie")}
              className={`px-4 py-2 rounded-full ${
                chartType === "pie" ? "bg-blue-500" : isDark ? "bg-gray-800" : "bg-gray-200"
              }`}
            >
              <Text className={`${chartType === "pie" ? "text-white" : isDark ? "text-gray-300" : "text-gray-700"}`}>
                Pie
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setChartType("bar")}
              className={`px-4 py-2 rounded-full mx-2 ${
                chartType === "bar" ? "bg-blue-500" : isDark ? "bg-gray-800" : "bg-gray-200"
              }`}
            >
              <Text className={`${chartType === "bar" ? "text-white" : isDark ? "text-gray-300" : "text-gray-700"}`}>
                Bar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setChartType("line")}
              className={`px-4 py-2 rounded-full ${
                chartType === "line" ? "bg-blue-500" : isDark ? "bg-gray-800" : "bg-gray-200"
              }`}
            >
              <Text className={`${chartType === "line" ? "text-white" : isDark ? "text-gray-300" : "text-gray-700"}`}>
                Line
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chart */}
        <View className={`mx-6 p-6 rounded-xl ${isDark ? "bg-gray-800" : "bg-white"} shadow-sm mb-6`}>
          <Text className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-800"}`}>
            {chartType === "pie" ? "Spending by Category" : chartType === "bar" ? "Top Categories" : "Daily Spending"}
          </Text>

          {chartType === "pie" && categoryData.length > 0 ? (
            <PieChart
              data={categoryData}
              width={screenWidth - 60}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => (isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`),
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : chartType === "bar" ? (
            <BarChart
              data={barData}
              width={screenWidth - 60}
              height={220}
              yAxisLabel="$"
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
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          ) : (
            <LineChart
              data={lineData}
              width={screenWidth - 60}
              height={220}
              yAxisLabel="$"
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
          )}

          {filteredExpenses.length === 0 && (
            <View className="items-center justify-center py-6">
              <Text className={isDark ? "text-gray-400" : "text-gray-500"}>
                No data available for the selected period
              </Text>
            </View>
          )}
        </View>

        {/* Summary */}
        <View className={`mx-6 p-6 rounded-xl ${isDark ? "bg-gray-800" : "bg-white"} shadow-sm mb-6`}>
          <Text className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-800"}`}>Summary</Text>

          <View className="space-y-4">
            <View className="flex-row justify-between">
              <Text className={isDark ? "text-gray-300" : "text-gray-600"}>Total Expenses</Text>
              <Text className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>
                ${filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className={isDark ? "text-gray-300" : "text-gray-600"}>Average per Day</Text>
              <Text className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>
                $
                {(
                  filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0) /
                  (timeframe === "week" ? 7 : timeframe === "month" ? 30 : 365)
                ).toFixed(2)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className={isDark ? "text-gray-300" : "text-gray-600"}>Highest Expense</Text>
              <Text className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>
                ${Math.max(...filteredExpenses.map((exp) => exp.amount), 0).toFixed(2)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className={isDark ? "text-gray-300" : "text-gray-600"}>Number of Transactions</Text>
              <Text className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>
                {filteredExpenses.length}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
