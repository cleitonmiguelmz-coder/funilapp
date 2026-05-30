import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

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

    console.log("=== NOTIFY API ===");
    console.log("token:", token ? token.substring(0, 20) + "..." : "VAZIO");
    console.log("title:", title);
    console.log("body:", body);
    console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
    console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL ? "OK" : "VAZIO");
    console.log("FIREBASE_PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY ? "OK" : "VAZIO");

    if (!token || !title || !body) {
      console.log("ERRO: Dados em falta");
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

    console.log("Notificação enviada com sucesso!");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erro ao enviar notificação:", err);
    return NextResponse.json({ error: "Erro ao enviar", detail: String(err) }, { status: 500 });
  }
}