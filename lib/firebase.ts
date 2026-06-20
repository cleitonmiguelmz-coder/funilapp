import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

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

// ── LOGIN com Google (único método disponível por agora) ────────────────────
// Quando houver domínio próprio, adicionar de volta email/senha + código de 5 dígitos
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);
  const user = res.user;

  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerificado: true, // Google já garante a posse do email
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  return user;
}

// ── LOGOUT ───────────────────────────────────────────────────────────────────
export async function logout() {
  return signOut(auth);
}

// ── OBSERVER de estado de autenticação ──────────────────────────────────────
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
