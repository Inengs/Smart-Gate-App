// src/api/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
// Import analytics only if you're using it and platform supports it
// Note: Analytics may need special setup in Expo

const firebaseConfig = {
    apiKey: "AIzaSyBRRMMiulcrPmqcgFAUY30W3wNpNdlB1tc",
    authDomain: "smart-gate-app-landmark-uni.firebaseapp.com",
    projectId: "smart-gate-app-landmark-uni",
    storageBucket: "smart-gate-app-landmark-uni.firebasestorage.app",
    messagingSenderId: "742973975598",
    appId: "1:742973975598:web:ef93053324fe55c96303bf",
    measurementId: "G-7HM55WLNST",
    // Add this line if you're using Realtime Database
    databaseURL: "https://smart-gate-app-landmark-uni-default-rtdb.europe-west1.firebasedatabase.app/" // "https://smart-gate-app-landmark-uni-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const database = getDatabase(app);
const firestore = getFirestore(app);

console.log("Firebase database initialized", database)

// Export the services
export { app, auth, database, firestore };