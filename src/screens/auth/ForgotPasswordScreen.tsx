"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Mail, ArrowLeft } from "lucide-react-native"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { TextInput } from "react-native-gesture-handler"

export default function ForgotPasswordScreen() {
  const navigation = useNavigation()
  const { resetPassword, loading } = useAuth()
  const { currentTheme } = useTheme()
  const isDark = currentTheme === "dark"

  const [email, setEmail] = useState("")
  const [localLoading, setLocalLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address")
      return
    }

    setLocalLoading(true)

    try {
      await resetPassword(email)
      setResetSent(true)
    } catch (error: any) {
      // Error is already handled in the auth context
      console.log("Reset password error handled in context")
    } finally {
      setLocalLoading(false)
    }
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-gray-900" : "bg-white"}`}>
      <View className="p-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          disabled={loading || localLoading}
          className="flex-row items-center"
        >
          <ArrowLeft size={20} color={isDark ? "white" : "black"} />
          <Text className={`ml-2 ${isDark ? "text-white" : "text-gray-800"}`}>Back to Login</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center px-8">
        <View className="items-center mb-8">
          <Image source={require("../../../assets/logo.png")} className="w-24 h-24" resizeMode="contain" />
          <Text className={`text-2xl font-bold mt-4 ${isDark ? "text-white" : "text-gray-800"}`}>Reset Password</Text>
          <Text className={`text-sm mt-2 text-center ${isDark ? "text-gray-300" : "text-gray-600"}`}>
            Enter your email address and we'll send you instructions to reset your password
          </Text>
        </View>

        {resetSent ? (
          <View className="items-center">
            <Text className={`text-lg font-medium mb-4 ${isDark ? "text-white" : "text-gray-800"}`}>
              Reset Email Sent!
            </Text>
            <Text className={`text-center mb-6 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Check your email for instructions on how to reset your password.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Login" as never)}
              className="bg-blue-500 rounded-lg py-3 px-6"
            >
              <Text className="text-white font-semibold">Return to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-4">
            <View
              className={`flex-row items-center border rounded-lg px-4 py-3 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-gray-50"}`}
            >
              <Mail size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
              <TextInput
                className={`flex-1 ml-2 ${isDark ? "text-white" : "text-gray-800"}`}
                placeholder="Email"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading && !localLoading}
              />
            </View>

            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={loading || localLoading}
              className={`rounded-lg py-3 items-center ${loading || localLoading ? "bg-blue-400" : "bg-blue-500"}`}
            >
              {loading || localLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold">Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}
