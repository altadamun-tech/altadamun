// src/firebase.ts
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCFj8AQGSxTeQx9CVP1aIA_w537zhbX_gw",
  authDomain: "hr-ab-a7348.firebaseapp.com",
  projectId: "hr-ab-a7348",
  storageBucket: "hr-ab-a7348.appspot.com",
  messagingSenderId: "926378815417",
  appId: "1:926378815417:web:fff2f047cfee594b785068"
};

export const app = initializeApp(firebaseConfig);
