"use client";

import { useEffect } from "react";

export default function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((reg) => console.log("Service Worker registado:", reg.scope))
        .catch((err) => console.error("Erro SW:", err));
    }
  }, []);

  return null;
}