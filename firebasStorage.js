import {
    getStorage,
    ref,
    getDownloadURL,
    deleteObject,
    uploadBytesResumable
} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-storage.js";
import {initializeApp} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-app.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-auth.js";
import {getDatabase} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-database.js";

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

const storage = getStorage();


export function downloadFile(uid) {
    const pathReference = ref(storage, 'images/' + uid + '.jpg');
    console.log(pathReference);
    let url = getDownloadURL(pathReference);
    url.then(function (url) {
        console.log(url);
        const profilPic = document.getElementById("profilPic");
        profilPic.src = url;
    })
        .catch((error) => {
            console.log("Aucune photo de profil");
        });
}

export function downloadFileOnline(uid) {
    const pathReference = ref(storage, 'images/' + uid + '.jpg');
    console.log(pathReference);
    let url = getDownloadURL(pathReference);
    url.then(function (url) {
        console.log(url);
    })
        .catch((error) => {
            console.log("Aucune photo de profil");
        });
    return url;
}



export async function uploadFile(uid, file) {
    console.log(file);
    const storage = getStorage();
    const storageRef = ref(storage, 'images/' + uid + '.jpg');
    const metadata = {
        contentType: 'image/jpeg'
    }

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on("state_changed",
        (snapshot) => {
            const progress =
                Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            console.log(progress);
        },
        (error) => {
            alert(error);
        },
        () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                const profilPic = document.getElementById("profilPic");
                profilPic.src = downloadURL;
            })});

}

//Delete file with uid in images folder
export function deleteProfilePicture(uid) {
    const pathReference = ref(storage, 'images/' + uid + '.jpg');
    console.log(pathReference);
    deleteObject(pathReference);
}