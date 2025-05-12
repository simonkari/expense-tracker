import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
  updateProfile,
  type User,
} from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../config/firebase"

export type UserData = {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  createdAt?: Date
  lastLoginAt?: Date
}

/**
 * Register a new user with email and password
 */
export const registerWithEmailPassword = async (
  email: string,
  password: string,
  displayName: string,
): Promise<UserData> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update profile with display name
    await updateProfile(user, { displayName })

    // Create user document in Firestore
    await createUserDocument(user, { displayName })

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    }
  } catch (error: any) {
    console.error("Error registering user:", error)
    throw new Error(error.message || "Failed to register")
  }
}

/**
 * Sign in with email and password
 */
export const signInWithEmailPassword = async (email: string, password: string): Promise<UserData> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update last login timestamp
    await updateUserLastLogin(user)

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    }
  } catch (error: any) {
    console.error("Error signing in:", error)
    throw new Error(error.message || "Failed to sign in")
  }
}

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (idToken: string): Promise<UserData> => {
  try {
    const credential = GoogleAuthProvider.credential(idToken)
    const userCredential = await signInWithCredential(auth, credential)
    const user = userCredential.user

    // Check if user document exists, create if not
    const userDoc = await getDoc(doc(db, "users", user.uid))
    if (!userDoc.exists()) {
      await createUserDocument(user)
    } else {
      await updateUserLastLogin(user)
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    }
  } catch (error: any) {
    console.error("Error signing in with Google:", error)
    throw new Error(error.message || "Failed to sign in with Google")
  }
}

/**
 * Sign out the current user
 */
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth)
  } catch (error: any) {
    console.error("Error signing out:", error)
    throw new Error(error.message || "Failed to sign out")
  }
}

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error: any) {
    console.error("Error resetting password:", error)
    throw new Error(error.message || "Failed to send password reset email")
  }
}

/**
 * Create a user document in Firestore
 */
export const createUserDocument = async (user: User, additionalData: { displayName?: string } = {}): Promise<void> => {
  if (!user.uid) return

  const userRef = doc(db, "users", user.uid)
  const snapshot = await getDoc(userRef)

  if (!snapshot.exists()) {
    const { email, displayName: authDisplayName, photoURL } = user
    const createdAt = serverTimestamp()

    try {
      await setDoc(userRef, {
        uid: user.uid,
        email,
        displayName: additionalData.displayName || authDisplayName,
        photoURL,
        createdAt,
        lastLoginAt: createdAt,
      })
    } catch (error) {
      console.error("Error creating user document:", error)
    }
  }
}

/**
 * Update user's last login timestamp
 */
export const updateUserLastLogin = async (user: User): Promise<void> => {
  if (!user.uid) return

  const userRef = doc(db, "users", user.uid)
  try {
    await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true })
  } catch (error) {
    console.error("Error updating last login:", error)
  }
}

/**
 * Get current user data from Firestore
 */
export const getCurrentUserData = async (): Promise<UserData | null> => {
  const user = auth.currentUser
  if (!user) return null

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid))
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserData
      return userData
    }
    return null
  } catch (error) {
    console.error("Error getting user data:", error)
    return null
  }
}
