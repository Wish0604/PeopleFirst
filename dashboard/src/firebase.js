import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyBAc6KkJ9de1KHjn4BFOFBQh_Mj0A6AFUY',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'peoplefirst-791ef.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'peoplefirst-791ef',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'peoplefirst-791ef.firebasestorage.app',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '771577061234',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:771577061234:web:411eb738e0ca4b9eb087eb',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);