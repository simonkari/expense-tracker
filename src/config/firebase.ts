import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Platform } from "react-native"
import Constants from "expo-constants"

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || "YOUR_API_KEY",
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || "YOUR_AUTH_DOMAIN",
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || "YOUR_PROJECT_ID",
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || "YOUR_STORAGE_BUCKET",
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || "YOUR_MESSAGING_SENDER_ID",
  appId: Constants.expoConfig?.extra?.firebaseAppId || "YOUR_APP_ID",
  measurementId: Constants.expoConfig?.extra?.firebaseMeasurementId || "YOUR_MEASUREMENT_ID",
}

// Initialize Firebase
let app
let auth

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig)

  // Use different auth initialization for web vs native
  if (Platform.OS === "web") {
    auth = getAuth(app)
  } else {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  }
} else {
  app = getApp()
  auth = getAuth(app)
}

const db = getFirestore(app)
const storage = getStorage(app)

export { app, auth, db, storage }
