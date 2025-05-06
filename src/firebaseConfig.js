import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC5Y9zer4ADBej2CYhnNZLe3elht1w8KP0",
    authDomain: "pokehall-ed8d0.firebaseapp.com",
    projectId: "pokehall-ed8d0",
    storageBucket: "pokehall-ed8d0.firebasestorage.app",
    messagingSenderId: "327911467028",
    appId: "1:327911467028:web:8e5070cb0e7aa12f79df01",
    measurementId: "G-E33SMNX5R7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);   // Firestore
const auth = getAuth(app);      // Firebase Auth

export { db, auth };
