import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const activarNotificacoes = async (userId: string): Promise<boolean> => {
  try {
    if (typeof window === "undefined") return false;
    if (!("Notification" in window)) return false;
    if (!("serviceWorker" in navigator)) return false;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    // Usa o SW já registado em vez de registar um novo
    const registration = await navigator.serviceWorker.ready;
    console.log("SW pronto:", registration);

    const { getMessagingInstance } = await import("@/lib/firebase");
    const { getToken } = await import("firebase/messaging");

    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.error("Messaging não suportado");
      return false;
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.error("Token FCM vazio");
      return false;
    }

    console.log("Token FCM obtido:", token.substring(0, 20) + "...");

    await updateDoc(doc(db, "users", userId), {
      fcmToken: token,
    });

    return true;
  } catch (err) {
    console.error("Erro FCM:", err);
    return false;
  }
};