import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

// Inicializa o Firebase Admin apenas uma vez
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
    const { token, title, body } = await req.json();

    if (!token || !title || !body) {
      return NextResponse.json({ error: "Dados em falta" }, { status: 400 });
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
    return NextResponse.json({ error: "Erro ao enviar" }, { status: 500 });
  }
}