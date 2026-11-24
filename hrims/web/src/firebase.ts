
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

import "../../../js/firebase-config.js";

const firebaseConfig = globalThis.FIREBASE_CONFIG;
if (firebaseConfig.projectId !== "altadamun-accounts") throw new Error("Unexpected Firebase project");

const app = initializeApp(firebaseConfig, "altadamun-accounts");
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
