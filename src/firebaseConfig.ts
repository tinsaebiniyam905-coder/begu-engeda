import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBg4CnebgRj2n5DspjuELhB4hYidsWToRY",
  authDomain: "begu-engda.firebaseapp.com",
  databaseURL: "https://begu-engda-default-rtdb.firebaseio.com",
  projectId: "begu-engda",
  storageBucket: "begu-engda.firebasestorage.app",
  messagingSenderId: "160228118540",
  appId: "1:160228118540:web:a6d1c43fd7538c0099de29",
  measurementId: "G-FDSJBH4FB0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, push, onValue, set };
