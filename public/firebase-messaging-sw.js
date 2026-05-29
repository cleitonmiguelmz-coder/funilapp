importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCfsEkOT9YsqZiXJCMaQw_6xhEiVoqUDog",
  authDomain: "whatsapp-funnel-34c95.firebaseapp.com",
  projectId: "whatsapp-funnel-34c95",
  storageBucket: "whatsapp-funnel-34c95.firebasestorage.app",
  messagingSenderId: "252066861188",
  appId: "1:252066861188:web:6ecf1dac2ef488387432d1",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: "/icon.png",
  });
});