// @ts-nocheck
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// This is a placeholder for the Firebase config object
// In a real application, this would be populated with your actual
// Firebase project configuration. For this demo, we will use
// a local emulator or a mock implementation.
const firebaseConfig = {
  apiKey:"AIzaSyDpPui2NWubev3xnkrNnHAhuo7FjxUT-Wk",
  authDomain: "attendease-res4h.firebaseapp.com",
  projectId: "attendease-res4h",
  storageBucket: "attendease-res4h.firebasestorage.app",
  messagingSenderId: "263796234536",
  appId: "1:263796234536:web:cd4d4541ab3b03b468181d",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
