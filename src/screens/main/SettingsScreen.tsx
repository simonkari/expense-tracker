"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, Switch, Alert, Share, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"
import * as Notifications from "expo-notifications"
import {
  Moon,
  Sun,
  User,
  LogOut,
  FileText,
  Bell,
  Fingerprint,
  HelpCircle,
  ChevronRight,
  Download,
} from "lucide-react-native"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { useExpenses } from "../../context/ExpenseContext"

export default function SettingsScreen() {
  const navigation = useNavigation()
  const { logout, biometricsAvailable } = useAuth()
  const { theme, setTheme } = useTheme()
  const { exportData } = useExpenses()

  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [biometricsEnabled, setBiometricsEnabled] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  const isDark = theme === "dark"

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error: any) {
      Alert.alert("Error", error.message)
    }
  }

  const handleThemeToggle = () => {
    setTheme(isDark ? "light" : "dark")
  }

  const handleNotificationsToggle = async () => {
    if (!notificationsEnabled) {
      const { status } = await Notifications.requestPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please enable notifications in your device settings to receive reminders.")
        return
      }
    }

    setNotificationsEnabled(!notificationsEnabled)
  }

  const handleBiometricsToggle = () => {
    if (!biometricsAvailable) {
      Alert.alert("Not Available", "Biometric authentication is not available on this device.")
      return
    }

    setBiometricsEnabled(!biometricsEnabled)
  }

  const handleExportData = async (format: "csv" | "pdf") => {
    try {
      setExportLoading(true)

      const data = await exportData(format)

      if (format === "csv") {
        const fileUri = `${FileSystem.documentDirectory}expenses.csv`
        await FileSystem.writeAsStringAsync(fileUri, data)

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri)
        } else {
          Alert.alert("Error", "Sharing is not available on this device")
        }
      } else {
        // In a real app, we would generate and share a PDF
        Alert.alert("PDF Export", "PDF export would be implemented here")
      }
    } catch (error: any) {
      Alert.alert("Export Error", error.message)
    } finally {
      setExportLoading(false)
    }
  }

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: "Check out this awesome expense tracker app!",
        // In a real app, you would include the app store link
        url: "https://example.com/app",
      })
    } catch (error: any) {
      Alert.alert("Error", error.message)
    }
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      <View className="p-6">
        <Text className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}>Settings</Text>
      </View>

      <View className="flex-1 px-6">
        {/* Account Section */}
        <View className="mb-6">
          <Text className={`text-sm font-medium mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>ACCOUNT</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate("Profile" as never)}
            className={`flex-row items-center justify-between p-4 rounded-lg mb-2 ${isDark ? "bg-gray-800" : "bg-white"}`}
          >
            <View className="flex-row items-center">
              <User size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
              <Text className={`ml-3 ${isDark ? "text-white" : "text-gray-800"}`}>Profile</Text>
            </View>
            <ChevronRight size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            className={`flex-row items-center justify-between p-4 rounded-lg ${isDark ? "bg-gray-800" : "bg-white"}`}
          >
            <View className="flex-row items-center">
              <LogOut size={20} color="#EF4444" />
              <Text className="ml-3 text-red-500">Logout</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View className="mb-6">
          <Text className={`text-sm font-medium mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>PREFERENCES</Text>

          <View
            className={`flex-row items-center justify-between p-4 rounded-lg mb-2 ${isDark ? "bg-gray-800" : "bg-white"}`}
          >
            <View className="flex-row items-center">
              {isDark ? <Moon size={20} color="#9CA3AF" /> : <Sun size={20} color="#6B7280" />}
              <Text className={`ml-3 ${isDark ? "text-white" : "text-gray-800"}`}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={handleThemeToggle}
              trackColor={{ false: "#767577", true: "#3B82F6" }}
              thumbColor="#f4f3f4"
            />
          </View>

          <View
            className={`flex-row items-center justify-between p-4 rounded-lg mb-2 ${isDark ? "bg-gray-800" : "bg-white"}`}
          >
            <View className="flex-row items-center">
              <Bell size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
              <Text className={`ml-3 ${isDark ? "text-white" : "text-gray-800"}`}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: "#767577", true: "#3B82F6" }}
              thumbColor="#f4f3f4"
            />
          </View>

          <View
            className={`flex-row items-center justify-between p-4 rounded-lg ${isDark ? "bg-gray-800" : "bg-white"}`}
          >
            <View className="flex-row items-center">
              <Fingerprint size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
              <Text className={`ml-3 ${isDark ? "text-white" : "text-gray-800"}`}>Biometric Authentication</Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={handleBiometricsToggle}
              trackColor={{ false: "#767577", true: "#3B82F6" }}
              thumbColor="#f4f3f4"
              disabled={!biometricsAvailable}
            />
          </View>
        </View>

        {/* Data Section */}
        <View className="mb-6">
          <Text className={`text-sm font-medium mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>DATA</Text>

          <TouchableOpacity
            onPress={() => handleExportData("csv")}
            disabled={exportLoading}
            className={`flex-row items-center justify-between p-4 rounded-lg mb-2 ${isDark ? "bg-gray-800" : "bg-white"}`}
          >
            <View className="flex-row items-center">
              <FileText size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
              <Text className={`ml-3 ${isDark ? "text-white" : "text-gray-800"}`}>Export as CSV</Text>
            </View>
            {exportLoading ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Download size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleExportData("pdf")}
            disabled={exportLoading}
            className={`flex-row items-center justify-between p-4 rounded-lg ${isDark ? "bg-gray-800" : "bg-white"}`}
          >
            <View className="flex-row items-center">
              <FileText size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
              <Text className={`ml-3 ${isDark ? "text-white" : "text-gray-800"}`}>Export as PDF</Text>
            </View>
            {exportLoading ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Download size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
            )}
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View>
          <Text className={`text-sm font-medium mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>ABOUT</Text>

          <TouchableOpacity
            onPress={handleShareApp}
            className={`flex-row items-center justify-between p-4 rounded-lg mb-2 ${isDark ? "bg-gray-800" : "bg-white"}`}
          >
            <View className="flex-row items-center">
              <HelpCircle size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
              <Text className={`ml-3 ${isDark ? "text-white" : "text-gray-800"}`}>Share App</Text>
            </View>
            <ChevronRight size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
          </TouchableOpacity>

          <View className={`p-4 rounded-lg ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <Text className={`text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}>Version 1.0.0</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}
