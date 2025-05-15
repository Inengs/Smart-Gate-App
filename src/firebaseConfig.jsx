import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, browserLocalPersistence } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native'; // Import Platform to detect the environment

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBRRMMiulcrPmqcgFAUY30W3wNpNdlB1tc",
    authDomain: "smart-gate-app-landmark-uni.firebaseapp.com",
    projectId: "smart-gate-app-landmark-uni",
    storageBucket: "smart-gate-app-landmark-uni.firebasestorage.app",
    messagingSenderId: "742973975598",
    appId: "1:742973975598:web:ef93053324fe55c96303bf",
    measurementId: "G-7HM55WLNST",
    databaseURL: "https://smart-gate-app-landmark-uni-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Auth with platform-specific persistence
const auth = initializeAuth(app, {
    persistence: Platform.OS === 'web'
        ? browserLocalPersistence // Use browser persistence for web
        : getReactNativePersistence(AsyncStorage) // Use AsyncStorage for native
});

const database = getDatabase(app);
const firestore = getFirestore(app);

console.log("Firebase database initialized", database);

export { app, auth, database, firestore };










// import { initializeApp } from "firebase/app";
// import { initializeAuth, getReactNativePersistence } from "firebase/auth";
// import { getDatabase } from "firebase/database";
// import { getFirestore } from "firebase/firestore";
// import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

// // Firebase configuration
// const firebaseConfig = {
//     apiKey: "AIzaSyBRRMMiulcrPmqcgFAUY30W3wNpNdlB1tc",
//     authDomain: "smart-gate-app-landmark-uni.firebaseapp.com",
//     projectId: "smart-gate-app-landmark-uni",
//     storageBucket: "smart-gate-app-landmark-uni.firebasestorage.app",
//     messagingSenderId: "742973975598",
//     appId: "1:742973975598:web:ef93053324fe55c96303bf",
//     measurementId: "G-7HM55WLNST",
//     databaseURL: "https://smart-gate-app-landmark-uni-default-rtdb.europe-west1.firebasedatabase.app/"
// };

// // Initialize Firebase app
// const app = initializeApp(firebaseConfig);

// // Initialize Auth with AsyncStorage persistence
// const auth = initializeAuth(app, {
//     persistence: getReactNativePersistence(AsyncStorage)
// });

// const database = getDatabase(app);
// const firestore = getFirestore(app);

// console.log("Firebase database initialized", database);

// export { app, auth, database, firestore };

