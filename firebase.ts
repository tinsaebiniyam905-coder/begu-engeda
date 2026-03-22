import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBg4CnebgRj2n5DspjuELhB4hYidsWToRY",
  authDomain: "begu-engda.firebaseapp.com",
  databaseURL: "https://begu-engda-default-rtdb.firebaseio.com",
  projectId: "begu-engda",
  storageBucket: "begu-engda.appspot.com",
  messagingSenderId: "160228118540",
  appId: "1:160228118540:web:a6d1c43fd7538c0099de29"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
