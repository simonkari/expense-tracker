"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useColorScheme } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

type Theme = "light" | "dark" | "system"

type ThemeContextType = {
  theme: Theme
  currentTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme()
  const [theme, setThemeState] = useState<Theme>("system")

  // Get the actual theme based on system preference or user choice
  const currentTheme = theme === "system" ? (colorScheme === "dark" ? "dark" : "light") : theme

  // Load saved theme from AsyncStorage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme")
        if (savedTheme) {
          setThemeState(savedTheme as Theme)
        }
      } catch (error) {
        console.error("Error loading theme:", error)
      }
    }

    loadTheme()
  }, [])

  // Set theme and save to AsyncStorage
  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme)
    try {
      await AsyncStorage.setItem("theme", newTheme)
    } catch (error) {
      console.error("Error saving theme:", error)
    }
  }

  return <ThemeContext.Provider value={{ theme, currentTheme, setTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
