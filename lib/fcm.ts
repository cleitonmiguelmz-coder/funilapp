import { getMessagingInstance } from "@/lib/firebase";
import { getToken } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const activarNotificacoes = async (userId: string): Promise<boolean> => {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return false;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

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