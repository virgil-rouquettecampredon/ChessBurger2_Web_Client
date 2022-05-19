/**===========================FIREBASE FUNCTION ============================== */


// Import the functions you need from the SDKs you need
import {initializeApp} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-app.js";
import {getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-auth.js";
import {
    getDatabase,
    ref,
    onValue,
    set,
    remove,
    update,
    get
} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-database.js";

import {downloadFile, deleteProfilePicture, uploadFile} from "./firebasStorage.js";


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

const loggin = async (email, pwd) => {
    const auth = getAuth();
    let user = await signInWithEmailAndPassword(auth, email, pwd)
        .then((userCredential) => {
            // Signed in
            user = userCredential.user;
            console.log(user);
            return user;

        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
        });
    return user;
}


/** ==============================FUNCTION FOR PAGE HTML================================ **/


async function startConnexion() {
    console.log("CONNEXION START !");

    let email = document.getElementById("mail").value;
    let mdp = document.getElementById("psw").value;
    let seSouvenirDeMoi = document.getElementById("souvenir").checked;

    console.log(" ====== CONNEXION ====== ");
    console.log(email);
    console.log(mdp);
    console.log(seSouvenirDeMoi);
    console.log(" ======================= ");
    signInWithEmailAndPassword(auth, email, mdp)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            console.log(user);
            isAuthentified = true;
            startHomePage();

        })
        .catch((error) => {
            console.log("ERREUR");
            const errorCode = error.code;
            const errorMessage = error.message;
        });

}

function startProfil(){
    cleanEverything();
    console.log("PROFIL STARTED !");
    const user = auth.currentUser.uid;
    const refUser = ref(db, "users/"+user);
    console.log(db);
    console.log(refUser);
    console.log(user);


    //UI TO MODIFY
    let profil_name         = document.getElementById("nameCoonected");
    let profil_description  = document.getElementById("profil_description");
    let profil_elo          = document.getElementById("profil_elo");

    onValue(refUser, (snapshot)=>{
        profil_elo.innerText = snapshot.val()['elo'];
        profil_name.innerText = snapshot.val()['pseudo'];
        profil_description.innerText = snapshot.val()['bio'];
    }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
    });

    downloadFile(user);



    dom_account.style.display           = "block";
    dom_OnlyProfil.style.display        = "block";
    dom_nav_deco.style.display          = "block";
}

function startCreerUnCompte(){
    const auth = getAuth();
    console.log("CREATE ACCOUNT START !");


    let mail               = document.getElementById("account_mail").value;
    let mdp                 = document.getElementById("account_psw").value;
    let pseudo              = document.getElementById("account_pseudo").value;

    console.log(" ====== CREATION ====== ");
    console.log(mail);
    console.log(mdp);
    console.log(pseudo);
    console.log(" ======================= ");
    createUserWithEmailAndPassword(auth, mail, mdp)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            console.log(user.uid);
            writeUserData(user.uid, mail, pseudo, mdp);
            isAuthentified = true;
            startHomePage();
        })
        .catch((error) => {
            console.log("ERROR");
            const errorCode = error.code;
            const errorMessage = error.message;
            // ..
        });
}

function writeUserData(userId, mail, pseudo, mdp) {
    const db = getDatabase();
    set(ref(db, 'users/' + userId), {
        pseudo: pseudo,
        elo: 1000,
        email: mail,
        bio: "Un g@meur avec un @ à la place du a",
        password: mdp
    });
}

function deleteAccount(){
    auth.currentUser.delete()
}

function deleteInformationAccount(){
    const user = auth.currentUser.uid;
    const refUser = ref(db, "users/"+user);
    remove(refUser);
    deleteAccount();
    deleteProfilePicture(user);
    isAuthentified = false;
    //TODO HIDE THE MODAL
    startHomePage();
}

function displayHistory(){
    //TODO Destroy old history display
    const user = auth.currentUser.uid;
    onValue(ref(db, 'history/' + user), (snapshot) => {
        console.log(snapshot.val());

        for (const snapshotKey in snapshot.val()) {
            console.log(snapshotKey);
            onValue(ref(db, 'history/' + user+ '/' + snapshotKey), (snap) => {
                console.log(snap.val());

                if (snap.val()['haveWin'] == 'win') {
                    addElementHistoryList(true, snap.val()['opponent'], snap.val()['eloDiff'], snap.val()['nbCoup'], "Echec et mat");
                } else {
                    addElementHistoryList(false, snap.val()['opponent'], snap.val()['eloDiff'], snap.val()['nbCoup'], "Echec et mat");
                }
            });

        }
    }, {
        onlyOnce: true
    });
}

function logout(){
    const auth = getAuth();
    signOut(auth).then(() => {
        isAuthentified = false;
        startHomePage();
        // Sign-out successful.
    }).catch((error) => {
        // An error happened.
    });
}

function closeHistory(){
    let history = document.getElementById("Historique_liste");
    history.innerHTML = "";
}

//TODO Start intent to put the player in gameBoard
function addParty(){
    const userId = getAuth().currentUser.uid;
    let name = document.getElementById("partyName").value;
    onValue(ref(db, 'users/' + userId), (snapshot) => {
        console.log(snapshot.val()['elo']);
        set(ref(db, 'rooms/' + userId), {
            player1: userId,
            player2: "",
            turn: 1,
            ranking:snapshot.val()['elo'] ,
            gameName: name,
            gameMode: "Normal",
            piece1: "",
            piece2: ""
        });
        //TODO PASS THIS 2 PARAMETERS
        document.getElementById("party").innerHTML += createAParty(name, userId);
        let buttonJoinParty = document.getElementById(userId);
        buttonJoinParty.addEventListener("click", function(){joinParty(name, userId)});
    }, {
        onlyOnce: true
    });
}
//TODO PUT THE USER.UID PLAYER ONE IN ON HIDDEN
function createAParty(name, user1) {
    return "<li class=\"list-group-item\">\n" + name + "\n" +
        "                <button id = '" + user1 + "' type=\"button\" class=\"btn btn-primary float-end p-4\"\">Rejoindre</button>\n" +
        "            </li>"
}

function joinParty(name, user1){
    console.log(name);
    console.log(user1);

    const userId = getAuth().currentUser.uid;
    update(ref(db, 'rooms/' + user1), {
        player2: userId
    });


    //TODO Start intent to enter to the game with UID PLAYER 1 + ID PLAYER (1 or 0)
}

function refreshListParty(){
    console.log("===============REFRESH LIST PARTY=======================")
    let listParty = document.getElementById("party");
    listParty.innerHTML = "";

    onValue(ref(db, 'rooms/'), (snapshot) => {
        console.log("===============SNAPSHOT VAL=======================")
        console.log(snapshot.val());

        for (const snapshotKey in snapshot.val()) {
            console.log("===============SNAPSHOT KEY=======================")
            console.log(snapshotKey);
            onValue(ref(db, 'rooms/' + snapshotKey), (snap) => {
                console.log("===============SNAP VAL=======================")
                console.log(snap.val());
                if(snap.val()['player2'] == "") {
                    console.log("CREATE A PARTY");
                    console.log(snap.val()['gameName'] +" " + snapshotKey)
                    listParty.innerHTML += createAParty(snap.val()['gameName'], snapshotKey);
                    let buttonJoinParty = document.getElementById(snapshotKey);
                    buttonJoinParty.addEventListener("click", function () {
                        joinParty(snap.val()['gameName'], snapshotKey)
                    });
                }
            });

        }
    }, {
        onlyOnce: true
    });
}

function startJouer() {
    cleanEverything();
    dom_nav_jouer.style.display = "none";
    dom_nav_profil.style.display = "block";

    console.log("JOUER STARTED !");

    if (isAuthentified) {
        startMenuGameOnline();
        refreshListParty();
    } else {
        startGame_local();
    }
}

function appliedChangementPseudo(){
    let pseudonyme = document.getElementById("changePseudoInput").value;
    const userId = getAuth().currentUser.uid;
    update(ref(db, 'users/' + userId), {
        pseudo: pseudonyme
    });
    document.getElementById("nameCoonected").innerText = pseudonyme;
}
let file;
function readURL(input) {
    if (input.files && input.files[0]) {
        let btn_pp_ut = document.getElementById("buttonValidPP");
        var reader = new FileReader();
        reader.onload = function (e) {
            console.log(e);
            file = input.files[0];
            //file = reader.result;
            //console.log(file);
            btn_pp_ut.classList.remove("disabled");
        };
        btn_pp_ut.classList.add("disabled");
        reader.readAsDataURL(input.files[0]);
    }
}

function upload(){
    let profilPic = document.getElementById("profilPic");
    const user = getAuth().currentUser.uid;
    uploadFile(user, file);
}

const logginButton = document.getElementById("logginButton");
const profilNavBar = document.getElementById("profilNavBar");
const buttonCreateAccount = document.getElementById("buttonCreateAccount");
const buttonDeleteAccount = document.getElementById("buttonDeleteAccount");
const history = document.getElementById("historyAction");
const disconnectButton = document.getElementById("disconnectButton");
const dissmissButton = document.getElementById("dissmissButton");
const createGameButton = document.getElementById("createGameButton");
const buttonJouer = document.getElementById("buttonJouer");
const buttonEdited = document.getElementById("buttonValidPseudo");
const ppimg = document.getElementById("ppimg");
const buttonUploadPP = document.getElementById("buttonValidPP");

logginButton.addEventListener("click", startConnexion);
profilNavBar.addEventListener("click", startProfil);
buttonCreateAccount.addEventListener("click", startCreerUnCompte);
buttonDeleteAccount.addEventListener("click", deleteInformationAccount);
history.addEventListener("click", displayHistory);
disconnectButton.addEventListener("click", logout);
dissmissButton.addEventListener("click", closeHistory);
createGameButton.addEventListener("click", addParty);
buttonJouer.addEventListener("click", startJouer);
buttonEdited.addEventListener("click", appliedChangementPseudo);
buttonUploadPP.addEventListener("click", upload);
ppimg.addEventListener("change", function(){readURL(ppimg)});