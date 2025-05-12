"use client"
import { View, ActivityIndicator, Text } from "react-native"
import { useTheme } from "../context/ThemeContext"

type LoadingScreenProps = {
  message?: string
}

export default function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  const { currentTheme } = useTheme()
  const isDark = currentTheme === "dark"

  return (
    <View className={`flex-1 items-center justify-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text className={`mt-4 text-lg ${isDark ? "text-gray-300" : "text-gray-700"}`}>{message}</Text>
    </View>
  )
}
