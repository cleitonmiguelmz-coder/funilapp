import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const activarNotificacoes = async (userId: string): Promise<boolean> => {
  try {
    if (typeof window === "undefined") return false;
    if (!("Notification" in window)) return false;
    if (!("serviceWorker" in navigator)) return false;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    // Regista e aguarda o SW ficar activo
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    console.log("SW estado:", registration.active ? "active" : "installing/waiting");

    // Aguarda o SW ficar activo
    await new Promise<void>((resolve) => {
      if (registration.active) {
        resolve();
        return;
      }
      const sw = registration.installing || registration.waiting;
      if (sw) {
        sw.addEventListener("statechange", (e) => {
          if ((e.target as ServiceWorker).state === "activated") {
            resolve();
          }
        });
      } else {
        // SW já existe mas não está no objeto — aguarda
        navigator.serviceWorker.ready.then(() => resolve());
      }
    });

    console.log("SW activo — a obter token FCM...");

    const { getMessagingInstance } = await import("@/lib/firebase");
    const { getToken } = await import("firebase/messaging");

    const messaging = await getMessagingInstance();
    if (!messaging) return false;

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.error("Token FCM vazio");
      return false;
    }

    console.log("Token FCM obtido com sucesso");

    await updateDoc(doc(db, "users", userId), {
      fcmToken: token,
    });

    return true;
  } catch (err) {
    console.error("Erro FCM:", err);
    return false;
  }
};