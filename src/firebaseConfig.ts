import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "begu-engeda.firebaseapp.com",
  databaseURL: "https://begu-engeda-default-rtdb.firebaseio.com",
  projectId: "begu-engeda",
  storageBucket: "begu-engeda.appspot.com",
  messagingSenderId: "160228118540",
  appId: "1:160228118540:web:a6d1c43fd7538c0099de29"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, push, onValue, set };
