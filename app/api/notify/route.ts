import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { userId, title, body } = await req.json();

    if (!userId || !title || !body) {
      return NextResponse.json({ error: "Dados em falta" }, { status: 400 });
    }

    // Busca o fcmToken no servidor (admin SDK ignora as regras)
    const db = getFirestore();
    const userSnap = await db.doc(`users/${userId}`).get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });
    }

    const token = userSnap.data()?.fcmToken;

    if (!token) {
      return NextResponse.json({ ok: true, info: "Sem token FCM" });
    }

    await getMessaging().send({
      token,
      notification: { title, body },
      webpush: {
        notification: {
          title,
          body,
          icon: "/icon.png",
          badge: "/icon.png",
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erro ao enviar notificação:", err);
    return NextResponse.json({ error: "Erro ao enviar", detail: String(err) }, { status: 500 });
  }
}