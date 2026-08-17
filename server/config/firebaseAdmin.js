import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// Uses GOOGLE_APPLICATION_CREDENTIALS from the environment to locate the
// service account key file (see .env.example). This gives the server
// privileged, read/write access to the Realtime Database, separate from
// the restricted, rules-enforced access the React client has.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

export const auth = admin.auth();
export const db = admin.database();
export default admin;
