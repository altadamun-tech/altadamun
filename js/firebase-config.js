globalThis.FIREBASE_CONFIG = {
  apiKey: "AIzaSyCJQWYH8AHi8K4XtIefJrbXOpCGK6Kmn1M",
  authDomain: "altadamun-accounts.firebaseapp.com",
  projectId: "altadamun-accounts",
  storageBucket: "altadamun-accounts.firebasestorage.app",
  messagingSenderId: "408969201455",
  appId: "1:408969201455:web:c51d93f95fc53d65fe03da"
};

globalThis.ALTADAMUN_LOGIN_EMAIL = value => {
  const username = value.trim().toLowerCase();
  if (username.includes("@")) return username;
  return (username === "it_" ? "it" : username) + "@" + globalThis.FIREBASE_CONFIG.authDomain;
};
