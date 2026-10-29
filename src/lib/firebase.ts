import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDbXhhkUmGohWVBkBGm4Bx-NKYU0AihsXg",
  authDomain: "boxmyindia-73479.firebaseapp.com",
  projectId: "boxmyindia-73479",
  storageBucket: "boxmyindia-73479.firebasestorage.app",
  messagingSenderId: "902974187806",
  appId: "1:902974187806:web:597d61ac48d58ea10bc10f",
  measurementId: "G-0SY2RZ4MKF"
};

// Initialize Firebase (singleton pattern)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Authentication
export const auth = getAuth(app);

// Firestore Database
export const db = getFirestore(app);

// Cloud Storage
export const storage = getStorage(app);

// Analytics (safely initialized only in supported browser environments)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export default app;
