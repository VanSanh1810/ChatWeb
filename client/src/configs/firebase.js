// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCtpedAjGO0l1EFv0QnoMGlceqVw2QZILs",
  authDomain: "chatapp-b90a5.firebaseapp.com",
  projectId: "chatapp-b90a5",
  storageBucket: "chatapp-b90a5.appspot.com",
  messagingSenderId: "665760173268",
  appId: "1:665760173268:web:9fadbe9f7d4c425ef4ff41",
  measurementId: "G-QBWFM80PJ2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export default app;