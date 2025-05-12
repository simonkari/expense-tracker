"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { Alert } from "react-native"
import { onAuthStateChanged, type User } from "firebase/auth"
import * as Google from "expo-auth-session/providers/google"
import * as WebBrowser from "expo-web-browser"
import * as LocalAuthentication from "expo-local-authentication"
import { auth } from "../config/firebase"
import {
  registerWithEmailPassword,
  signInWithEmailPassword,
  signInWithGoogle,
  signOutUser,
  resetPassword,
  type UserData,
} from "../services/authService"

WebBrowser.maybeCompleteAuthSession()

type AuthContextType = {
  user: User | null
  userData: UserData | null
  loading: boolean
  initializing: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  googleSignIn: () => Promise<void>
  authenticateWithBiometrics: () => Promise<boolean>
  biometricsAvailable: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [biometricsAvailable, setBiometricsAvailable] = useState(false)

  // Google Auth
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: "YOUR_GOOGLE_CLIENT_ID",
    androidClientId: "YOUR_ANDROID_CLIENT_ID",
    iosClientId: "YOUR_IOS_CLIENT_ID",
    webClientId: "YOUR_WEB_CLIENT_ID",
  })

  // Check for biometric availability
  useEffect(() => {
    ;(async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync()
      const enrolled = await LocalAuthentication.isEnrolledAsync()
      setBiometricsAvailable(compatible && enrolled)
    })()
  }, [])

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        // Convert Firebase user to UserData
        setUserData({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        })
      } else {
        setUserData(null)
      }

      setInitializing(false)
    })

    return unsubscribe
  }, [])

  // Handle Google Sign In response
  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params
      setLoading(true)

      signInWithGoogle(id_token)
        .then((userData) => {
          console.log("Successfully signed in with Google", userData)
        })
        .catch((error) => {
          console.error("Error signing in with Google:", error)
          Alert.alert("Error", "Failed to sign in with Google")
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [response])

  // Register with email and password
  const register = async (email: string, password: string, name: string) => {
    setLoading(true)

    try {
      await registerWithEmailPassword(email, password, name)
    } catch (error: any) {
      console.error("Error registering:", error)
      Alert.alert("Registration Failed", error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Login with email and password
  const login = async (email: string, password: string) => {
    setLoading(true)

    try {
      await signInWithEmailPassword(email, password)
    } catch (error: any) {
      console.error("Error logging in:", error)
      Alert.alert("Login Failed", error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Logout
  const logout = async () => {
    setLoading(true)

    try {
      await signOutUser()
    } catch (error: any) {
      console.error("Error logging out:", error)
      Alert.alert("Logout Failed", error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Reset password
  const handleResetPassword = async (email: string) => {
    setLoading(true)

    try {
      await resetPassword(email)
      Alert.alert("Password Reset", "Check your email for password reset instructions")
    } catch (error: any) {
      console.error("Error resetting password:", error)
      Alert.alert("Reset Failed", error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Google Sign In
  const googleSignIn = async () => {
    try {
      await promptAsync()
    } catch (error: any) {
      console.error("Error with Google Sign In:", error)
      Alert.alert("Google Sign In Failed", error.message)
      throw error
    }
  }

  // Biometric authentication
  const authenticateWithBiometrics = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to access your expenses",
        fallbackLabel: "Use passcode",
      })

      return result.success
    } catch (error) {
      console.error("Error with biometric authentication:", error)
      return false
    }
  }

  const value = {
    user,
    userData,
    loading,
    initializing,
    login,
    register,
    logout,
    resetPassword: handleResetPassword,
    googleSignIn,
    authenticateWithBiometrics,
    biometricsAvailable,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
