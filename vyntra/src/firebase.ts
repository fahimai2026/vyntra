import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBE7uqZbQQBQIcUIybfDxnSoQ_2CeM2-qU",
  authDomain: "vyntra-social.firebaseapp.com",
  projectId: "vyntra-social",
  storageBucket: "vyntra-social.firebasestorage.app",
  messagingSenderId: "562041971574",
  appId: "1:562041971574:web:47df2c06561b6bd0da5057",
  measurementId: "G-82940D7HSB"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

