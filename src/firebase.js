// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBnrsKn-a_gLx-5ma_MueGRkgn_tIOqSFk",
    authDomain: "queuetrackrweb.firebaseapp.com",
    projectId: "queuetrackrweb",
    storageBucket: "queuetrackrweb.firebasestorage.app",
    messagingSenderId: "531544166633",
    appId: "1:531544166633:web:d14bcb7c15d2a73d2fe078",
    measurementId: "G-ML56XE5FM2"
  };
  

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
