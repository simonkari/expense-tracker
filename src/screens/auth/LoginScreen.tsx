"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Mail, Lock, Eye, EyeOff } from "lucide-react-native"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { TextInput } from "react-native-gesture-handler"

export default function LoginScreen() {
  const navigation = useNavigation()
  const { login, googleSignIn, authenticateWithBiometrics, biometricsAvailable, loading } = useAuth()
  const { currentTheme } = useTheme()
  const isDark = currentTheme === "dark"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [localLoading, setLocalLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    setLocalLoading(true)

    try {
      await login(email, password)
      // Navigation is handled by the auth state change in Navigation component
    } catch (error: any) {
      // Error is already handled in the auth context
      console.log("Login error handled in context")
    } finally {
      setLocalLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await googleSignIn()
      // Navigation is handled by the auth state change in Navigation component
    } catch (error: any) {
      // Error is already handled in the auth context
      console.log("Google sign in error handled in context")
    }
  }

  const handleBiometricLogin = async () => {
    if (!biometricsAvailable) {
      Alert.alert("Not Available", "Biometric authentication is not available on this device")
      return
    }

    const success = await authenticateWithBiometrics()

    if (success) {
      // In a real app, you would need to have the user's credentials stored securely
      // and then use them to log in after successful biometric authentication
      Alert.alert("Success", "Biometric authentication successful")
    } else {
      Alert.alert("Failed", "Biometric authentication failed")
    }
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-gray-900" : "bg-white"}`}>
      <View className="flex-1 justify-center px-8">
        <View className="items-center mb-8">
          <Image source={require("../../../assets/logo.png")} className="w-24 h-24" resizeMode="contain" />
          <Text className={`text-2xl font-bold mt-4 ${isDark ? "text-white" : "text-gray-800"}`}>Welcome Back</Text>
          <Text className={`text-sm mt-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>Sign in to your account</Text>
        </View>

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

          <View
            className={`flex-row items-center border rounded-lg px-4 py-3 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-gray-50"}`}
          >
            <Lock size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
            <TextInput
              className={`flex-1 ml-2 ${isDark ? "text-white" : "text-gray-800"}`}
              placeholder="Password"
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading && !localLoading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={loading || localLoading}>
              {showPassword ? (
                <EyeOff size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
              ) : (
                <Eye size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword" as never)}
            className="self-end"
            disabled={loading || localLoading}
          >
            <Text className="text-blue-500">Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading || localLoading}
            className={`rounded-lg py-3 items-center ${loading || localLoading ? "bg-blue-400" : "bg-blue-500"}`}
          >
            {loading || localLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold">Sign In</Text>
            )}
          </TouchableOpacity>

          {biometricsAvailable && (
            <TouchableOpacity
              onPress={handleBiometricLogin}
              disabled={loading || localLoading}
              className={`rounded-lg py-3 items-center border ${isDark ? "border-gray-700" : "border-gray-300"}`}
            >
              <Text className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>
                Sign In with Biometrics
              </Text>
            </TouchableOpacity>
          )}

          <View className="flex-row items-center my-4">
            <View className={`flex-1 h-px ${isDark ? "bg-gray-700" : "bg-gray-300"}`} />
            <Text className={`mx-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}>OR</Text>
            <View className={`flex-1 h-px ${isDark ? "bg-gray-700" : "bg-gray-300"}`} />
          </View>

          <TouchableOpacity
            onPress={handleGoogleSignIn}
            disabled={loading || localLoading}
            className={`rounded-lg py-3 items-center border ${isDark ? "border-gray-700" : "border-gray-300"}`}
          >
            <View className="flex-row items-center">
              <Image source={require("../../../assets/google.png")} className="w-5 h-5 mr-2" />
              <Text className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>Continue with Google</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-8">
          <Text className={isDark ? "text-gray-300" : "text-gray-600"}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register" as never)} disabled={loading || localLoading}>
            <Text className="text-blue-500 font-semibold">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}
