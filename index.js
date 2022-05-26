/** ================================================== FIREBASE FUNCTION ==================================================== **/
//==============================================================================================================

// Import the functions you need from the SDKs you need
import {initializeApp} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-auth.js";
import {
    getDatabase,
    ref,
    onValue,
    set,
    remove,
    update,
    off
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
console.log("INIT FIREBASE APP  :       DONE");
const auth = getAuth(app);
const db = getDatabase();
let refTurn;
let refLoose;
console.log("GET DB             :       DONE");

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

function logout() {
    const auth = getAuth();
    signOut(auth).then(() => {
        isAuthentified = false;
        startHomePage();
        // Sign-out successful.
    }).catch((error) => {
        // An error happened.
    });
}


function writeUserData(userId, mail, pseudo, mdp) {
    const db = getDatabase();
    set(ref(db, 'users/' + userId), {
        pseudo: pseudo,
        elo: 1000,
        email: mail,
        bio: "Un g@meur avec un @ à la place du a",
        password: mdp,
        useAnimations : 0
    });
}

function deleteAccount() {
    auth.currentUser.delete()
}

export function deleteRoom(uid) {
    const refUser = ref(db, "rooms/" + uid);
    remove(refUser);
}

function appliedChangementUserInformation() {
    let pseudonyme = dom_edit_pseudo.value;
    let biographie = dom_edit_description.value
    const userId = getAuth().currentUser.uid;
    update(ref(db, 'users/' + userId), {
        pseudo: pseudonyme,
        bio: biographie
    });
    document.getElementById("nameCoonected").innerText = pseudonyme;
    dom_profil_description.innerText = biographie;
}

function startCreerUnCompte() {
    const auth = getAuth();
    console.log("===== CREATE ACCOUNT START ! =====");


    let mail    = document.getElementById("account_mail").value;
    let mdp     = document.getElementById("account_psw").value;
    let pseudo  = document.getElementById("account_pseudo").value;

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
            if(mdp.length<6){
                dom_alert_message_toast.innerText = "Impossible de créer un compte avec un mot de passe de moins de 6 caractères.";
            }else{
                dom_alert_message_toast.innerText = "Impossible de créer un compte avec cette adresse mail :  " + mail;
            }
            showToast(4000);
            const errorCode = error.code;
            const errorMessage = error.message;
            // ..
        });
}

export function takePseudoAndElo(player, cb) {
    const refUser = ref(db, "users/" + player);

    onValue(refUser, (snapshot) => {
        cb(snapshot.val()['pseudo'], snapshot.val()['elo']);
    }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
    }, {
        onlyOnce: true
    });
}

//idHistory, player, eloDiff, haveWin, nbCoup, opponent, typeVict
export function writeHistory(idHistory, player, eloDifference, win, coup, oppo, typeVict) {
    const db = getDatabase();

    set(ref(db, 'history/' + player + '/' + idHistory), {
        eloDiff         : eloDifference,
        haveWin         : win,
        nbCoup          : coup,
        opponent        : oppo,
        TypeVictoire    : typeVict
    });

    console.log("=> IM WRITING IN THE DB");
    console.log("=> ELO DIFF:" + eloDifference);
}

export function writeEloWinOrLoss(player, eloDiff) {
    update(ref(db, 'users/' + player), {
        elo: eloDiff
    });
}

function deleteInformationAccount() {
    const user = auth.currentUser.uid;
    const refUser = ref(db, "users/" + user);
    remove(refUser);
    deleteAccount();
    deleteProfilePicture(user);
    isAuthentified = false;
    startHomePage();
}

function upload() {
    let profilPic = document.getElementById("profilPic");
    const user = getAuth().currentUser.uid;
    uploadFile(user, file);
}


/** ==================================================FUNCTION FOR GM ==================================================== **/
export function looseListener(uid, playerIndex, obj) {
    console.log("LOOSE LISTENER");
    refLoose = ref(db, "rooms/" + uid + '/loose');
    onValue(refLoose, (snapshot) => {
        //turn listener simplification

        if (snapshot.val() == playerIndex) {
            obj.winByFF();
        }
        console.log(" ========== =============== ========== ");
    }, /*{
        onlyOnce: true
    }*/);
}

export function turnListener(uid, playerIndex, obj) {
    console.log("TURN LISTENER");
    console.log(uid);
    console.log(playerIndex);
    console.log(obj);
    console.log("================");
    refTurn = ref(db, "rooms/" + uid + '/turn');
    onValue(refTurn, (snapshot) => {
        //turn listener simplification

        let v = snapshot.val();
        console.log(" ========== I CHECK CHANGES ========== ");
        console.log("PLAYER INDEX   : " + playerIndex);
        console.log("SNASHOT VAL    : " + v);
        console.log("SUP ZERO       : " + (obj.nbTurn + playerIndex));
        console.log("OBJ NBTURN     : " + (obj.nbTurn));

        if ((v == (playerIndex + 1)) && ((obj.nbTurn + playerIndex) > 0)) {
            console.log(" ==========CHANGES TO PUSH ========== ");
            onEnemyPlayerPlay(uid, obj);
        }

        console.log(" ========== =============== ========== ");
    }, /*{
        onlyOnce: true
    }*/);
}

export function destroyListener(){
    console.log("DESTROY LISTENER")
    off(refTurn);
    off(refLoose);
}

//Quand un joueur ennemi va jouer un coup
//On doit récupérer ces informations pour pouvoir les jouer ensuite
function onEnemyPlayerPlay(uid, obj) {
    console.log(" ==== ON ENEMY PLAY ==== ");
    console.log("UID        : " + uid);
    console.log(obj);
    console.log(" ==== ============= ==== ");


    const refPiece = ref(db, "rooms/" + uid);
    onValue(refPiece, (snapshot) => {
        //First we need to read the value of the loose elem

        let loose = snapshot.val()['loose'];
        //if(loose == obj.playerIndex){
        //    obj.winByFF();
        //}
        //if(loose == null){

            //Nobody loosed, so we continue to play the enemy shot
            let piece1 = snapshot.val()['piece1'];
            let piece2 = snapshot.val()['piece2'];

            console.log(" ===== SNAPSHOT GET DB SHOT ===== ");
            console.log(piece1);
            console.log(piece2);
            console.log(" ===== ==================== ===== ");

            if(piece1.length !== 0) {
                let move        = piece1.split("/");
                let posStart    = move[0].split("_");
                let posEnd      = move[1].split("_");
                let idTransform = move[2];

                console.log("COUT ADVERSE JOUE : ");
                console.log(posStart);
                console.log(posEnd);
                console.log(idTransform);
                console.log("=====================");
                obj.shotsToPerform.push(new DB_Shots(
                    new Position(
                        parseInt(posStart[0]),
                        parseInt(posStart[1])
                    ),
                    new Position(
                        parseInt(posEnd[0]),
                        parseInt(posEnd[1])
                    ),
                    parseInt(move[2])));

                if (piece2.length !== 0) {
                    let move2           = piece2.split("/");
                    let posStart2       = move2[0].split("_");
                    let posEnd2         = move2[1].split("_");
                    obj.shotsToPerform.push(new DB_Shots(new Position(parseInt(posStart2[0]), parseInt(posStart2[1])), new Position(parseInt(posEnd2[0]), parseInt(posEnd2[1])), -1));
                }
            }
            obj.playAllEnemyShots();
        //}
    }, {
        onlyOnce: true
    });
}

//Fonction permettant de mettre à jour la DB
export function SyncToDataBase(uid,playerIndex,shotToPush){
    console.log("SYNC TO DATABASE !");
    console.log(shotToPush);
    console.log(playerIndex);
    console.log(uid);
    console.log("===================");


    if (shotToPush.length > 0){
        update(ref(db, 'rooms/' + uid), {
            piece1: "" + shotToPush[0].startPosPlayerPlay.x + "_" + shotToPush[0].startPosPlayerPlay.y + "/" + shotToPush[0].endPosPlayerPlay.x + "_" + shotToPush[0].endPosPlayerPlay.y + "/" + shotToPush[0].IDTransformedPiece
        });
    }
    else{
        update(ref(db, 'rooms/' + uid), {
            piece1: ""
        });
    }

    if (shotToPush.length > 1){
        update(ref(db, 'rooms/' + uid), {
            piece2: "" + shotToPush[1].startPosPlayerPlay.x + "_" + shotToPush[1].startPosPlayerPlay.y + "/" + shotToPush[1].endPosPlayerPlay.x + "_" + shotToPush[1].endPosPlayerPlay.y
        });
    }
    else {
        update(ref(db, 'rooms/' + uid), {
            piece2: ""
        });
    }

    if (playerIndex == 0){
        update(ref(db, 'rooms/' + uid),{
            turn : 2
        });
    }
    else{
        update(ref(db, 'rooms/' + uid),{
            turn : 1
        });
    }

    shotToPush.length = 0;
}

export function setOnLoose(uid, playerIndex){
    let playerIndexage = 1 - playerIndex
    update(ref(db, 'rooms/' + uid), {
        loose: playerIndexage
    });

    if (playerIndex == 0){
        update(ref(db, 'rooms/' + uid),{
            turn : 2
        });
    }
    else{
        update(ref(db, 'rooms/' + uid),{
            turn : 1
        });
    }
}

export function addHistoryGame(player, nbCoup, haveWin, opponent, eloDiff, typeVict) {
    //Save the finish game instance
    let today = new Date();
    let idHistory = "" + today.getDay() + "" + today.getMonth() + "" + today.getFullYear() + "" + today.getHours() + ":"+ today.getMinutes() + ":" + today.getSeconds();
    writeHistory(idHistory, player, eloDiff, haveWin, nbCoup, opponent, typeVict);
}

/**===============================================FUNCTION FOR PAGE HTML==================================================== **/
//==============================================================================================================
import {GameManager} from "./js/Model/Game.js";
import {GameManagerOnline, DB_Shots} from "./js/Model/GameOnline.js";
import {Board} from "./js/Model/Board.js";
import {Piece, King, Bishop, Pawn, Queen, Knight, Tower} from "./js/Model/Piece.js";
import {Player} from "./js/Model/Player.js";
import {MovementPiece, Movement, Position} from "./js/Model/Movement.js";
//==============================================================================================================
let animation_value;

//========== Reset les UIs affichés
function cleanEverything() {
    dom_main_game.style.cssText                 = "display : none !important";
    dom_main_home.style.display                 = "none";
    dom_main_list_parties.style.cssText         = "display : none !important";
    dom_main_bg_parallax.style.display          = "none";
    dom_main_account.style.display              = "none";
    dom_main_menu_games.style.display           = "none";
    dom_nav_partyName.style.display             = "none";
    //dom_main_OnlyProfil.style.display = "none";
    dom_nav_options.style.display               = "none";

    dom_nav_profil.style.display                = "none";
    dom_nav_authentification.style.display      = "none";
    dom_nav_deco.style.display                  = "none";
    dom_nav_jouer.style.display                 = "block";
    dom_createAccount.style.display             = "none";
    dom_arrow_animation.style.display           = "block";

    dom_nav_homePage_logo.style.display         = "block";
    dom_nav_homePage_home.style.display         = "block";
}

//Fonction appelée pour charger la page principale de jeu
function startHomePage() {
    cleanEverything();

    dom_nav_options.style.display           = "block";
    if (isAuthentified) {
        dom_nav_profil.style.display        = "block";
        dom_connection.style.display        = "none";
        dom_createAccount.style.display     = "none";
        dom_nav_deco.style.display          = "block";
        dom_arrow_animation.style.display   = "none";
    } else {
        dom_nav_authentification.style.display  = "block";
        dom_connection.style.display            = "block";
    }
    dom_main_home.style.display                 = "block";
}

//========== Fonctions de jeu
function startJouer() {
    dom_button_restart.style.display = "none";
    dom_text_ff.style.display        = "block";
    dom_button_ff.style.display      = "inline-block";

    if (isAuthentified) {
        cleanEverything();
        dom_nav_jouer.style.display         = "none";
        dom_main_menu_games.style.display   = "block";
        dom_main_list_parties.style.cssText = "display : block !important";
        dom_main_bg_parallax.style.display  = "block";
        refreshListParty();
    } else {
        startGame_local();
    }
}

//lancer une partie locale
function startGame_local() {
    cleanEverything();
    dom_nav_partyName.style.display = "block";
    dom_nav_partyName.innerText     = "Partie locale";
    dom_nav_jouer.style.display     = "none";
    dom_main_game.style.cssText     = "display : flex !important";
    game.innerHTML                  = "";
    game_ui.innerHTML               = "";

    //Construction et lancement de la partie
    let board   = new Board();
    gameManager = new GameManager(board);
    gameManager.start();
}

//Construction et lancement de la partie en ligne
function startGame_online(name) {
    //console.log(" ++++++++++++ ONLINE ++++++++++++ ");
    cleanEverything();

    dom_nav_homePage_logo.style.display         = "none";
    dom_nav_homePage_home.style.display         = "none";

    dom_nav_partyName.innerText         = name;
    dom_nav_partyName.style.display     = "block";

    dom_nav_jouer.style.display         = "none";

    dom_main_game.style.cssText         = "display : flex !important";
    game.innerHTML                      = "";
    game_ui.innerHTML                   = "";

    //Création du plateau de jeu
    let board   = new Board();
    //Création du gestionnaire de partie
    gameManager = new GameManagerOnline(board,gameNameOnlineActivity);
    gameManager.initParty();

    gameManager.playerIndex = player;

    if (player == 0) {
        //console.log("JE SUIS LE PREMIER JOUEUR");
        //Si c'est le premier joueur a rentrer dans la partie
        //On ne connait que le premier joueur pour l'instant, celui qui vient de générer la partie
        gameManager.addAPlayerToTheRoom(auth.currentUser.uid);
        //On attend le second joueur pour lancer la partie
        wait2Player();
    } else {
        //console.log("JE SUIS LE SECOND JOUEUR");
        //Si c'est le joueur joueur a rentrer dans la partie
        //Alors on renseigne les joueurs et on commmence à jouer
        gameManager.addAPlayerToTheRoom(gameNameOnlineActivity);
        gameManager.addAPlayerToTheRoom(auth.currentUser.uid);
        gameManager.start();
    }
}

function wait2Player() {
    const user      = auth.currentUser.uid;
    const refUser   = ref(db, "rooms/" + user + '/player2');
    onValue(refUser, (snapshot) => {
        if (snapshot.val() != "") {
            console.log("SECOND PLAYER JOIN THE GAME !");
            gameManager.addAPlayerToTheRoom(snapshot.val());
            gameManager.start();
            off(refUser);
        }
    });
}

function getSvgVictory(v) {
    return ((v) ? "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"64\" class=\"bi bi-star-fill\" viewBox=\"0 0 16 16\">\n" +
        "     <path d=\"M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z\"/>\n" +
        "     </svg>\n" : " <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"64\" class=\"bi bi-x-circle\" viewBox=\"0 0 16 16\">\n" +
        "<path d=\"M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z\"/>\n" +
        "<path d=\"M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z\"/>\n" +
        "</svg>");
}

//Ajouter un élément à la liste de l'historique des parties
function addElementHistoryList(victory, NomDuJoueur, NombreDePoints, NombreDeCouts, TypeDeVictoire) {
    let nb_el = dom_history_liste.children.length + 1;
    dom_history_liste.innerHTML +=
        "<div class=\"accordion-item\">\n" +
        "                            <h2 class=\"accordion-header\" id=\"heading_" + nb_el + "\">\n" +
        "                                        <button class=\"accordion-button collapsed\" type=\"button\" aria-expanded=\"false\" data-bs-toggle=\"collapse\" data-bs-target=\"#collapse_" + nb_el + "\" aria-controls=\"collapse_" + nb_el + "\">\n" +
        "                                            <div class=\"float-end history_btn_res " + ((victory) ? "win" : "loose") + "\">\n" +
        "                                                <p>" + ((victory) ? "+" : "") + NombreDePoints + "</p>\n" + getSvgVictory(victory) +
        "                                            </div>\n" +
        "                                            <div class=\"playerName ps-5\">\n" +
        "                                                <h4>" + NomDuJoueur + "</h4>\n" +
        "                                            </div>\n" +
        "                                        </button>\n" +
        "                                    </h2>\n" +
        "                            <div id=\"collapse_" + nb_el + "\" class=\"accordion-collapse collapse\" aria-labelledby=\"heading_" + nb_el + "\" data-bs-parent=\"#Historique_liste\">\n" +
        "                                        <div class=\"accordion-body row\">\n" +
        "                                            <div class=\"col-8 text-center\">Nombre de couts</div>\n" +
        "                                            <div class=\"col-4\" style=\"color: #7BC2BE\">" + NombreDeCouts + "</div>\n" +
        "                                            <div class=\"col-8 text-center\">Type de victoire</div>\n" +
        "                                            <div class=\"col-4\" style=\"color: #7BC2BE\">" + TypeDeVictoire + "</div>\n" +
        "                                        </div>\n" +
        "                                    </div>\n" +
        "                        </div>"
}

//Ajouter un élément à la liste des classements de jeu
function addElementClassementList(nbTrophee, NomDuJoueur) {
    dom_classement_liste.innerHTML += "<div class=\"list-group-item py-4\" style=\"font-size: x-large\">\n" +
        "                            <div class=\"trophee_classement float-start me-5\">\n" +
        "                                <p>" + nbTrophee + "</p>\n" +
        "                                <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"64\" class=\"bi bi-trophy-fill\" viewBox=\"0 0 16 16\">\n" +
        "                                    <path d=\"M2.5.5A.5.5 0 0 1 3 0h10a.5.5 0 0 1 .5.5c0 .538-.012 1.05-.034 1.536a3 3 0 1 1-1.133 5.89c-.79 1.865-1.878 2.777-2.833 3.011v2.173l1.425.356c.194.048.377.135.537.255L13.3 15.1a.5.5 0 0 1-.3.9H3a.5.5 0 0 1-.3-.9l1.838-1.379c.16-.12.343-.207.537-.255L6.5 13.11v-2.173c-.955-.234-2.043-1.146-2.833-3.012a3 3 0 1 1-1.132-5.89A33.076 33.076 0 0 1 2.5.5zm.099 2.54a2 2 0 0 0 .72 3.935c-.333-1.05-.588-2.346-.72-3.935zm10.083 3.935a2 2 0 0 0 .72-3.935c-.133 1.59-.388 2.885-.72 3.935z\"/>\n" +
        "                                </svg>\n" +
        "                            </div>\n" +
        "                            <p>" + NomDuJoueur + "</p>\n" +
        "                        </div>";
}


//========== Fonctions de connection
//Quand l'utilisateur a oublié son mot de passe
function startForgotPsw() {
}

//Changer entre connection et création de compte
function swapConnectionCreation() {
    if (swap_crea_con) {
        dom_connection.style.display    = "none";
        dom_createAccount.style.display = "block";
    } else {
        dom_connection.style.display    = "block";
        dom_createAccount.style.display = "none";
    }
    swap_crea_con = !swap_crea_con;
}

async function startConnexion() {
    console.log(" ========= CONNEXION START !");

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

            console.log("CONNEXION :                DONE");
            startHomePage();
        })
        .catch((error) => {
            console.log("CONNEXION :                ERROR");
            const errorCode = error.code;
            const errorMessage = error.message;
            dom_alert_message_toast.innerText = "Compte innexistant, veuillez en créer un !";
            showToast(3000);
        });

}

//TODO Start intent to put the player in gameBoard
function addParty() {
    //Réactiver le scroll


    const userId = getAuth().currentUser.uid;

    let name = document.getElementById("partyName").value;

    onValue(ref(db, 'users/' + userId), (snapshot) => {
        //console.log(snapshot.val()['elo']);
        set(ref(db, 'rooms/' + userId), {
            player1: userId,
            player2: "",
            turn: 1,
            ranking: snapshot.val()['elo'],
            gameName: name,
            gameMode: "Normal",
            piece1: "",
            piece2: ""
        });

        //On construit une partie
        gameNameOnlineActivity      = userId;
        startGame_online(name);
    }, {
        onlyOnce: true
    });
}

//TODO PUT THE USER.UID PLAYER ONE IN ON HIDDEN
function createAParty(name, user1) {
    return "<li class=\"list-group-item\">" + name + "\n" +
        " <button id = '" + user1 + "' type=\"button\" class=\"btn btn-primary float-end p-4\"> Rejoindre </button> \n" +
        " </li>";
}

function createTestRoom() {
    /*return "<li class=\"list-group-item\">\n" +
        "            DeepRed room\n" +
        "            <button type=\"button\" class=\"btn btn-primary float-end p-4 disabled\">Complet</button>\n" +
        "        </li>\n" +
        "        ";*/

    return "<li class=\"list-group-item\">\n" +
        "            DeepRed room\n" +
        "            <button type=\"button\" class=\"btn btn-primary float-end p-4\" onclick='showToast()' >Complet</button>\n" +
        "        </li>\n" +
        "        ";
}

function joinParty(name, user1) {
    //console.log("============ JOIN A PARTY ============");
    //console.log(name);
    //console.log(user1);
    //console.log("============ ============ ============");

    onValue(ref(db, 'rooms/' + user1), (snapshshot) => {
        let player2 = snapshshot.val()['player2'];
        if (player2 == ""){
            const userId = getAuth().currentUser.uid;
            update(ref(db, 'rooms/' + user1), {
                player2: userId
            });
            //Si on rejoint la partie en cour, on est nécessairement le joueur deux
            player                  = 1;
            gameNameOnlineActivity  = user1;
            startGame_online(name);
        }
        else{
            dom_alert_message_toast.innerText = "Partie pleine !";
            showToast(3000);
        }
    }, {
        onlyOnce: true
    });
}

function refreshListParty() {
    //console.log("===============REFRESH LIST PARTY=======================")
    let listParty = document.getElementById("party");
    listParty.innerHTML = createTestRoom();

    onValue(ref(db, 'rooms/'), (snapshot) => {
        //console.log("===============SNAPSHOT VAL=======================")
        //console.log(snapshot.val());

        for (const snapshotKey in snapshot.val()) {
            //console.log("===============SNAPSHOT KEY=======================")
            //console.log(snapshotKey);

            onValue(ref(db, 'rooms/' + snapshotKey), (snap) => {
                //console.log("===============SNAP VAL=======================")
                //console.log(snap.val());

                if (snap.val()['player2'] == "") {

                    //console.log("CREATE A PARTY DOM");
                    //console.log(snap.val()['gameName'] + " " + snapshotKey);

                    listParty.innerHTML += createAParty(snap.val()['gameName'], snapshotKey);
                    let buttonJoinParty = document.getElementById(snapshotKey);

                    //console.log(buttonJoinParty);

                    buttonJoinParty.addEventListener("click", function () {
                        //console.log("I CLICK ON JOIN");
                        joinParty(snap.val()['gameName'], snapshotKey)
                    });
                }
            },{
                onlyOnce: true
            });

        }
    }, {
        onlyOnce: true
    });
}

let file;

function readURL(input) {
    if (input.files && input.files[0]) {
        let btn_pp_ut = document.getElementById("buttonValidPP");
        var reader = new FileReader();
        reader.onload = function (e) {
            //console.log(e);
            file = input.files[0];
            //file = reader.result;
            //console.log(file);
            btn_pp_ut.classList.remove("disabled");
        };
        btn_pp_ut.classList.add("disabled");
        reader.readAsDataURL(input.files[0]);
    }
}

async function displayClassment(){
    let mapClassement = new Map();

    onValue(ref(db, 'users/'), (snapshot) => {
        let i = 0;
        for (const snapshotKey in snapshot.val()) {
            onValue(ref(db, 'users/' + snapshotKey), (snap) => {
                let pseudo = snap.val()['pseudo'];
                let elo = snap.val()['elo'];

                mapClassement.set(snapshotKey, {
                    'elo': elo,
                    'pseudo': pseudo
                });
                i+=1;
                if (i == Object.keys(snapshot.val()).length){
                    const mapSorted = new Map([...mapClassement.entries()].sort((a, b) => b[1]['elo'] - a[1]['elo']));

                    //Display classement
                    dom_classement_liste.innerHTML = "";
                    //Display element on the history
                    for (let el of mapSorted) {
                        addElementClassementList(el[1]['elo'], el[1]['pseudo']);
                    }
                }
                //console.log(mapClassement)
            }, {
                onlyOnce: true
            });
        }

    }, {
        onlyOnce: true
    });
}


//========== Fonctions de profil
function startProfil() {
    cleanEverything();
    console.log("PROFIL STARTED");
    const user = auth.currentUser.uid;
    const refUser = ref(db, "users/" + user);
    //console.log(db);
    //console.log(refUser);
    //console.log(user);


    //UI TO MODIFY
    let profil_name = document.getElementById("nameCoonected");
    let profil_description = document.getElementById("profil_description");
    let profil_elo = document.getElementById("profil_elo");

    onValue(refUser, (snapshot) => {
        profil_elo.innerText = snapshot.val()['elo'];
        profil_name.innerText = snapshot.val()['pseudo'];
        profil_description.innerText = snapshot.val()['bio'];
    }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
    }, {
        onlyOnce: true
    });

    downloadFile(user);

    dom_main_account.style.display = "block";
    //dom_main_OnlyProfil.style.display        = "block";
    dom_nav_deco.style.display = "block";
}

//Changer place holder pour l'édition du profil
function loadPlaceHolder() {
    dom_edit_pseudo.setAttribute('value', dom_profil_name.innerText);
    dom_edit_description.setAttribute('value', dom_profil_description.innerText);
}

//Sauvegarder les données de changement de préférences
function startEditPreference() {
    //console.log("ANIMATION : " + dom_switch_animation.value);
    updatePreferences((dom_switch_animation.checked)? 0:1);
}

//Récupération préférences DB
function retrivePreferences(){
    //console.log("GET VALUE FROM PREFERENCES");

    const user = auth.currentUser.uid;
    onValue(ref(db, 'users/' + user+ "/useAnimations"), (snapshot) => {
        //Get animation value
        //animation_value = (snapshot.val() == 0);
        dom_switch_animation.checked = (snapshot.val() == 0);
        //console.log("preferences : " + dom_switch_animation.checked);
    },{
        onlyOnce : true
    });
}

function updatePreferences(val) {
    //console.log("UPDATE PREFERENCES : " + val);

    const user = auth.currentUser.uid;
    update(ref(db, 'users/' + user), {
        useAnimations: val
    });

    ANIMATION_PIECE = (val === 0);
}

function displayHistory() {
    //console.log("DISPLAY HISTORY");
    dom_history_liste.innerHTML = "";

    const user = auth.currentUser.uid;
    onValue(ref(db, 'history/' + user), (snapshot) => {
        //console.log(snapshot.val());

        for (const snapshotKey in snapshot.val()) {
            //console.log(snapshotKey);
            onValue(ref(db, 'history/' + user + '/' + snapshotKey), (snap) => {
                //console.log(snap.val());

                if (snap.val()['haveWin'] == 'win') {
                    addElementHistoryList(true, snap.val()['opponent'], snap.val()['eloDiff'], snap.val()['nbCoup'], snap.val()['TypeVictoire']);
                } else {
                    addElementHistoryList(false, snap.val()['opponent'], snap.val()['eloDiff'], snap.val()['nbCoup'], snap.val()['TypeVictoire']);
                }
            });

        }
    }, {
        onlyOnce: true
    });
}


//==============================================================================================================
//Onclick sur les bouttons de l'application
dom_nav_homePage_logo.addEventListener('click', startHomePage);
dom_nav_homePage_home.addEventListener('click', startHomePage);
dom_logginButton.addEventListener("click", startConnexion);
dom_profilNavBar.addEventListener("click", startProfil);
dom_buttonCreateAccount.addEventListener("click", startCreerUnCompte);
dom_buttonDeleteAccount.addEventListener("click", deleteInformationAccount);
dom_history.addEventListener("click", displayHistory);
dom_disconnectButton.addEventListener("click", logout);
//dom_dissmissButton.addEventListener("click", closeHistory);
dom_createGameButton.addEventListener("click", addParty);
dom_buttonJouer.addEventListener("click", startJouer);
dom_buttonEdited.addEventListener("click", appliedChangementUserInformation);
dom_buttonUploadPP.addEventListener("click", upload);
dom_ppimg.addEventListener("change", function () {
    readURL(dom_ppimg)
});
dom_forgot_psw.addEventListener('click', startForgotPsw);
dom_classement.addEventListener('click', displayClassment);
dom_button_swap.addEventListener('click', swapConnectionCreation);
dom_button_swap_bis.addEventListener('click', swapConnectionCreation);
dom_button_game_local.addEventListener('click', startGame_local);
dom_button_edit_profil.addEventListener('click', loadPlaceHolder);
dom_button_edit_preference.addEventListener('click', startEditPreference);
dom_game_refresh.addEventListener('click', refreshListParty);
dom_button_goOnline.addEventListener('click', function () {
    document.body.scrollIntoView(false);
});
preferencesAction.addEventListener('click', function (){
    retrivePreferences();
});
dom_button_ff.addEventListener('click', function () {
    if(gameManager && !gameManager.gameStopped) {
        gameManager.onFFGame();
        if (gameManager.constructor === GameManager) {
            dom_button_restart.style.display = "inline-block";
        }
        dom_text_ff.style.display       = "none";
        dom_button_ff.style.display     = "none";
    }
});
dom_button_restart.addEventListener('click', function (){
    startGame_local();
    dom_button_restart.style.display = "none";
    dom_text_ff.style.display        = "block";
    dom_button_ff.style.display      = "inline-block";
});
dom_button_option.addEventListener('click', function (){
    //If the game is stoped, we need to indicate an option to go back to the main page
    if(gameManager!==undefined) {
        if (gameManager.constructor === GameManagerOnline) {
            if (gameManager.gameFinish) {
                //console.log(gameManager);
                dom_button_option_goToHome.style.display = "inline-block";
                dom_button_ff.style.display = "none";
                dom_text_ff.style.display = "none";
                //console.log(dom_button_option_goToHome);
            } else {
                if (gameManager.gameStarted) {
                    dom_button_option_goToHome.style.display = "none";
                    dom_button_ff.style.display = "inline-block";
                    dom_text_ff.style.display = "block";
                } else {
                    dom_button_option_goToHome.style.display = "inline-block";
                    dom_button_ff.style.display = "none";
                    dom_text_ff.style.display = "none";
                }
            }
        } else {
            if(gameManager.gameFinish){
                dom_button_restart.style.display = "inline-block";
                dom_button_option_goToHome.style.display = "none";
                dom_button_ff.style.display = "none";
                dom_text_ff.style.display = "none";
            }else{
                dom_button_restart.style.display = "none";
                dom_button_option_goToHome.style.display = "none";

                dom_button_ff.style.display = "inline-block";
                dom_text_ff.style.display = "block";
            }
            dom_button_option_goToHome.style.display = "none";
        }
    }
});
dom_button_option_goToHome.addEventListener('click', function (){
   startHomePage();
});

window.onload = startHomePage;
