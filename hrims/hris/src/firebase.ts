// src/firebase.ts
import { initializeApp } from "firebase/app";

import "../../../js/firebase-config.js";

const firebaseConfig = globalThis.FIREBASE_CONFIG;
if (firebaseConfig.projectId !== "altadamun-accounts") throw new Error("Unexpected Firebase project");

export const app = initializeApp(firebaseConfig, "altadamun-accounts");