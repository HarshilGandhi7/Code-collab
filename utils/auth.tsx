import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "@/firebaseConfig";

interface UserData {
  username: string;
  email: string;
  createdAt: Date;
  [key: string]: any;
}

export const getUserData = async (userId: string): Promise<UserData | null> => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return userDocSnap.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

export const loginUser = async (
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    const userData = await getUserData(user.uid);
    if (!userData) {
      return { success: false, error: "User data not found" };
    }
    setAuthCookie(user.uid, 7);

    return { success: true, user };
  } catch (error: any) {
    console.error("Login error:", error);
    return {
      success: false,
      error:
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
          ? "Invalid email or password"
          : "Login failed. Please try again.",
    };
  }
};

export const signUpUser = async (
  username: string,
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    const isUsernameAvailable = await checkUsernameAvailability(username);
    if (!isUsernameAvailable) {
      return { success: false, error: "Username is already taken" };
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await updateProfile(user, { displayName: username });

    await setDoc(doc(db, "users", user.uid), {
      username,
      email,
      createdAt: new Date(),
    });

    return { success: true, user };
  } catch (error: any) {
    console.error("Signup error:", error);
    let errorMessage = "Failed to create account. Please try again.";

    if (error.code === "auth/email-already-in-use") {
      errorMessage = "This email is already registered.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address.";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password must be at least 6 characters.";
    }

    return { success: false, error: errorMessage };
  }
};

export const checkUsernameAvailability = async (
  username: string
): Promise<boolean> => {
  try {
    const userRef = collection(db, "users");
    const q = query(userRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  } catch (error) {
    console.error("Error checking username availability:", error);
    throw error;
  }
};

export const logoutUser = async (): Promise<boolean> => {
  try {
    await signOut(auth);
    clearAuthCookie();
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    return false;
  }
};

const setAuthCookie = (userId: string, expiryDays: number) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);

  document.cookie = `authUserId=${userId}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
  document.cookie = `isAuthenticated=true; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
};

const clearAuthCookie = () => {
  document.cookie =
    "authUserId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict";
  document.cookie =
    "isAuthenticated=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict";
};

export const isAuthenticatedByCookie = (): boolean => {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const trimmedCookie = cookie.trim();
    if (trimmedCookie.startsWith("isAuthenticated=true")) {
      return true;
    }
  }
  return false;
};

export const getAuthUserIdFromCookie = (): string | null => {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const trimmedCookie = cookie.trim();
    if (trimmedCookie.startsWith("authUserId=")) {
      return trimmedCookie.substring("authUserId=".length);
    }
  }
  return null;
};

export const getUserDataFromCookie = async (): Promise<UserData | null> => {
  const userId = getAuthUserIdFromCookie();
  if (!userId) {
    return null;
  }

  try {
    return await getUserData(userId);
  } catch (error) {
    console.error("Error fetching user data from cookie:", error);
    return null;
  }
};

export const getAuthenticatedUser = async (): Promise<{isAuthenticated: boolean;userData: UserData | null;}> => {
  const isAuthenticated = isAuthenticatedByCookie();

  if (!isAuthenticated) {
    return { isAuthenticated: false, userData: null };
  }

  const userData = await getUserDataFromCookie();

  return {
    isAuthenticated: true,
    userData,
  };
};
