// Import the functions you need from the SDKs you need
import {initializeApp} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-app.js";
import {getAnalytics} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-analytics.js";
import {getAuth, signInWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDUZOATWaLIrzuCyab4Y-xmFibkXMOO14U",
    authDomain: "mobile-a37ba.firebaseapp.com",
    databaseURL: "https://mobile-a37ba-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "mobile-a37ba",
    storageBucket: "mobile-a37ba.appspot.com",
    messagingSenderId: "326443844961",
    appId: "1:326443844961:web:ba764c6ed9518220217120",
    measurementId: "G-LR3BFKW8CR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("OUI");
const auth = getAuth(app);
const db = getDatabase();


export const loggin = (email, pwd) =>{
    const auth = getAuth();
    signInWithEmailAndPassword(auth, email, pwd)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            return user;
            console.log(user);
            // ...
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
        });
}