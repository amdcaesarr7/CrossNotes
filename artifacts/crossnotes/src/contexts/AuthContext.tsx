import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider, isConfigured } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isFirebaseReady: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isFirebaseReady: false,
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser && db) {
        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, {
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              xp: 0,
              totalXp: 0,
              streak: 0,
              streakFreezes: 0,
              coins: 0,
              lastStudied: null,
              createdAt: serverTimestamp(),
            });
            const lbRef = doc(db, "leaderboard", firebaseUser.uid);
            await setDoc(lbRef, {
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              xp: 0,
              streak: 0,
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          console.error("[AuthContext] Failed to sync user doc:", err);
        }
      }
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) throw new Error("Firebase not configured — check your .env file");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === "auth/popup-closed-by-user") return;
      throw err;
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (err) {
      console.error("[AuthContext] Sign-out failed:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isFirebaseReady: isConfigured, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
