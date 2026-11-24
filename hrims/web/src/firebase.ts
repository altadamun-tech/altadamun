import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCFj8AQGSxTeQx9CVP1aIA_w537zhbX_gw",
  authDomain: "hr-ab-a7348.firebaseapp.com",
  projectId: "hr-ab-a7348",
  storageBucket: "hr-ab-a7348.appspot.com",
  messagingSenderId: "926378815417",
  appId: "1:926378815417:web:fff2f047cfee594b785068"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };