// Firebase client configuration.
// Replace the placeholder values below with the config from your
// Firebase Console -> Project Settings -> General -> Your apps -> SDK setup and configuration.
// Also enable "Email/Password" under Authentication -> Sign-in method,
// and create a Realtime Database instance (start in "locked" mode, then
// deploy the rules found in /firebase-database-rules.json at the project root).

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAet5TYdss66nrBTs-2wHPDMV69qsTZvvU",
  authDomain: "fuo-eval-system.firebaseapp.com",
  projectId: "fuo-eval-system",
  storageBucket: "fuo-eval-system.firebasestorage.app",
  messagingSenderId: "1022312322214",
  appId: "1:1022312322214:web:1af693f9245b378975d067"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;
