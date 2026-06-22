import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCfsEkOT9YsqZiXJCMaQw_6xhEiVoqUDog",
  authDomain: "whatsapp-funnel-34c95.firebaseapp.com",
  projectId: "whatsapp-funnel-34c95",
  storageBucket: "whatsapp-funnel-34c95.firebasestorage.app",
  messagingSenderId: "252066861188",
  appId: "1:252066861188:web:6ecf1dac2ef488387432d1",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ── LOGOUT ───────────────────────────────────────────────────────────────────
export async function logout() {
  return signOut(auth);
}

// ── OBSERVER de estado de autenticação ──────────────────────────────────────
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
