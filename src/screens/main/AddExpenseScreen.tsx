"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import DateTimePicker from "@react-native-community/datetimepicker"
import { Calendar, DollarSign, X } from "lucide-react-native"
import { useExpenses, type Category } from "../../context/ExpenseContext"
import { useTheme } from "../../context/ThemeContext"

export default function AddExpenseScreen() {
  const navigation = useNavigation()
  const { categories, addExpense } = useExpenses()
  const { currentTheme } = useTheme()
  const isDark = currentTheme === "dark"

  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [date, setDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!amount || !description || !selectedCategory) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    const amountNum = Number.parseFloat(amount)

    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Error", "Please enter a valid amount")
      return
    }

    setLoading(true)

    try {
      await addExpense({
        amount: amountNum,
        description,
        category: selectedCategory,
        date,
      })

      // Reset form
      setAmount("")
      setDescription("")
      setSelectedCategory(null)
      setDate(new Date())

      // Navigate back
      navigation.goBack()
    } catch (error: any) {
      Alert.alert("Error", error.message)
    } finally {
      setLoading(false)
    }
  }

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false)
    if (selectedDate) {
      setDate(selectedDate)
    }
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <X size={24} color={isDark ? "white" : "black"} />
        </TouchableOpacity>
        <Text className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>Add Expense</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          className={`px-4 py-2 rounded-lg ${loading ? "bg-blue-400" : "bg-blue-500"}`}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-semibold">Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-6">
        {/* Amount Input */}
        <View className="mb-6">
          <Text className={`text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>Amount</Text>
          <View
            className={`flex-row items-center border rounded-lg px-4 py-3 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white"}`}
          >
            <DollarSign size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
            <TextInput
              className={`flex-1 ml-2 text-lg ${isDark ? "text-white" : "text-gray-800"}`}
              placeholder="0.00"
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Description Input */}
        <View className="mb-6">
          <Text className={`text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>Description</Text>
          <TextInput
            className={`border rounded-lg px-4 py-3 ${isDark ? "border-gray-700 bg-gray-800 text-white" : "border-gray-300 bg-white text-gray-800"}`}
            placeholder="What was this expense for?"
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Date Picker */}
        <View className="mb-6">
          <Text className={`text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>Date</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className={`flex-row items-center border rounded-lg px-4 py-3 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white"}`}
          >
            <Calendar size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
            <Text className={`ml-2 ${isDark ? "text-white" : "text-gray-800"}`}>{date.toLocaleDateString()}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        {/* Category Selection */}
        <View>
          <Text className={`text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => setSelectedCategory(category)}
                className={`mr-3 p-3 rounded-lg ${
                  selectedCategory?.id === category.id
                    ? "border-2 border-blue-500"
                    : isDark
                      ? "border border-gray-700"
                      : "border border-gray-300"
                }`}
                style={{
                  backgroundColor:
                    selectedCategory?.id === category.id
                      ? `${category.color}33` // Add transparency
                      : isDark
                        ? "#1F2937"
                        : "white",
                }}
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: category.color }}
                >
                  <Text className="text-white text-lg">{category.name.charAt(0)}</Text>
                </View>
                <Text className={`text-center ${isDark ? "text-white" : "text-gray-800"}`}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
