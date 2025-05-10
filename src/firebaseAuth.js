// src/firebaseAuth.js
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { db } from './firebaseConfig';

// Get the Firebase app instance that was already initialized
const auth = getAuth();
export default auth;