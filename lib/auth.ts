import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCfsEkOT9YsqZiXJCMaQw_6xhEiVoqUDog",
  authDomain: "whatsapp-funnel-34c95.firebaseapp.com",
  projectId: "whatsapp-funnel-34c95",
  storageBucket: "whatsapp-funnel-34c95.firebasestorage.app",
  messagingSenderId: "252066861188",
  appId: "1:252066861188:web:6ecf1dac2ef488387432d1"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

// REGISTRO
export async function register(email: string, password: string) {
  const res = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, "users", res.user.uid), {
    uid: res.user.uid,
    email,
    createdAt: serverTimestamp()
  });

  return res.user;
}

// LOGIN
export async function login(email: string, password: string) {
  const res = await signInWithEmailAndPassword(auth, email, password);
  return res.user;
}

// LOGOUT
export async function logout() {
  return signOut(auth);
}

// OBSERVER
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}