"use client"
import { View, Text, TouchableOpacity } from "react-native"
import { WifiOff } from "lucide-react-native"
import { useExpenses } from "../context/ExpenseContext"
import { useTheme } from "../context/ThemeContext"

export default function OfflineNotice() {
  const { isOnline, syncOfflineData } = useExpenses()
  const { currentTheme } = useTheme()
  const isDark = currentTheme === "dark"

  if (isOnline) return null

  return (
    <View className={`flex-row items-center justify-between px-4 py-2 ${isDark ? "bg-red-900" : "bg-red-100"}`}>
      <View className="flex-row items-center">
        <WifiOff size={16} color={isDark ? "#FCA5A5" : "#DC2626"} />
        <Text className={`ml-2 ${isDark ? "text-red-200" : "text-red-700"}`}>
          You're offline. Changes will be saved locally.
        </Text>
      </View>
      <TouchableOpacity
        onPress={syncOfflineData}
        className={`px-2 py-1 rounded-md ${isDark ? "bg-red-800" : "bg-red-200"}`}
      >
        <Text className={isDark ? "text-red-200" : "text-red-700"}>Try Sync</Text>
      </TouchableOpacity>
    </View>
  )
}
