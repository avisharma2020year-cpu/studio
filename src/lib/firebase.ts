// @ts-nocheck
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDpPui2NWubev3xnkrNnHAhuo7FjxUT-Wk",
  authDomain: "attendease-res4h.firebaseapp.com",
  projectId: "attendease-res4h",
  storageBucket: "attendease-res4h.firebasestorage.app",
  messagingSenderId: "263796234536",
  appId: "1:263796234536:web:cd4d4541ab3b03b468181d",
  measurementId: "G-DGN0LG51YE"
};

// Initialize Firebase (avoid re-initializing on hot reloads)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export { app, db, auth, analytics };
