declare global {
  var ALTADAMUN_LOGIN_EMAIL: (value: string) => string;
  var FIREBASE_CONFIG: { apiKey: string; authDomain: string; projectId: string; storageBucket: string; messagingSenderId: string; appId: string };
}
export {};
