import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const activarNotificacoes = async (userId: string): Promise<boolean> => {
  try {
    // Verifica se o browser suporta notificações
    if (typeof window === "undefined") return false;
    if (!("Notification" in window)) return false;
    if (!("serviceWorker" in navigator)) return false;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    // Importa dinamicamente para não quebrar no Safari
    const { getMessagingInstance } = await import("@/lib/firebase");
    const { getToken } = await import("firebase/messaging");

    const messaging = await getMessagingInstance();
    if (!messaging) return false;

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (!token) return false;

    await updateDoc(doc(db, "users", userId), {
      fcmToken: token,
    });

    return true;
  } catch (err) {
    console.error("Erro FCM:", err);
    return false;
  }
};