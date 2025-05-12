"use client"

import "react-native-gesture-handler"
import { useEffect, useState } from "react"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { NavigationContainer } from "@react-navigation/native"
import * as SplashScreen from "expo-splash-screen"
import * as Notifications from "expo-notifications"
import { registerRootComponent } from "expo"
import { useFonts } from "expo-font"
import { ThemeProvider } from "./src/context/ThemeContext"
import { AuthProvider } from "./src/context/AuthContext"
import { ExpenseProvider } from "./src/context/ExpenseContext"
import Navigation from "./src/navigation"
import { LogBox, View } from "react-native"
import OfflineNotice from "./src/components/OfflineNotice"

// Ignore specific warnings
LogBox.ignoreLogs([
  "AsyncStorage has been extracted from react-native",
  "Setting a timer for a long period of time",
  "Firebase: Error (auth/missing-android-pkg-name).",
  "Firebase: Error (auth/missing-continue-uri).",
  "Firebase: Error (auth/missing-ios-bundle-id).",
])

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync()

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

function App() {
  const [appIsReady, setAppIsReady] = useState(false)

  // Load fonts
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("./assets/fonts/Inter-Regular.ttf"),
    "Inter-Medium": require("./assets/fonts/Inter-Medium.ttf"),
    "Inter-SemiBold": require("./assets/fonts/Inter-SemiBold.ttf"),
    "Inter-Bold": require("./assets/fonts/Inter-Bold.ttf"),
  })

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make API calls, etc.
        // Artificially delay for two seconds to simulate a slow loading
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (e) {
        console.warn(e)
      } finally {
        // Tell the application to render
        setAppIsReady(true)
        await SplashScreen.hideAsync()
      }
    }

    prepare()
  }, [])

  if (!appIsReady || !fontsLoaded) {
    return null
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ExpenseProvider>
            <NavigationContainer>
              <View style={{ flex: 1 }}>
                <OfflineNotice />
                <Navigation />
              </View>
              <StatusBar style="auto" />
            </NavigationContainer>
          </ExpenseProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}

export default registerRootComponent(App)
