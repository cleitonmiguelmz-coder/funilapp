import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const activarNotificacoes = async (userId: string): Promise<boolean> => {
  try {
    if (typeof window === "undefined") return false;
    if (!("Notification" in window)) return false;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    // Guarda no Firestore que este utilizador quer notificações
    await updateDoc(doc(db, "users", userId), {
      notificacoesActivas: true,
    });

    return true;
  } catch (err) {
    console.error("Erro:", err);
    return false;
  }
};

// Dispara notificação nativa do sistema
export const mostrarNotificacao = (title: string, body: string) => {
  if (typeof window === "undefined") return;
  if (Notification.permission !== "granted") return;
  new Notification(title, {
    body,
    icon: "/icon.png",
    badge: "/icon.png",
  });
};