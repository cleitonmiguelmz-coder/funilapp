import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export type Lead = {
  nome: string;
  telefone: string;
  cidade: string;
  pagamento: string;
  intencao: string;
};

export async function salvarLead(data: Lead) {
  try {
    await addDoc(collection(db, "leads"), {
      ...data,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Erro ao salvar lead:", error);
    throw new Error("Falha ao salvar lead");
  }
}