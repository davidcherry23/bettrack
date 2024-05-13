// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAaVOmHDYkG1qHxI6QpFpgM-B3MAQXY-2U",
    authDomain: "bettrack-88281.firebaseapp.com",
    projectId: "bettrack-88281",
    storageBucket: "bettrack-88281.appspot.com",
    messagingSenderId: "674702146250",
    appId: "1:674702146250:web:5aec6047588594e163d233",
    measurementId: "G-SKEKMK613Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
