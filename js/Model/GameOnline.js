/* ==================================================================================
    GAME ONLINE BEHAVIORS
================================================================================== */
import {GameManager} from "./Game.js";
import {Board, main_color_piece} from "./Board.js";
import {Piece,King,Bishop,Pawn,Queen,Knight,Tower} from "./Piece.js";
import {Player} from "./Player.js";
import {MovementPiece, Movement} from "./Movement.js";
import{downloadFile} from "../../firebasStorage.js";

//Coups en DB plus légers
class DB_Shots{
    constructor(startPosPlayerPlay, endPosPlayerPlay, IDTransformedPiece) {
        this.startPosPlayerPlay = startPosPlayerPlay;
        this.endPosPlayerPlay = endPosPlayerPlay;
        this.IDTransformedPiece = IDTransformedPiece;
    }
}

//Gestionnaire de partie de jeu
export class GameManagerOnline extends GameManager {
    constructor(board, name) {
        super(board);
        this.shotsToPush = [];
        this.shotsToPerform = [];

        this.players.push(new Player(name,main_color_piece[0]));
        this.players.push(new Player("En attente",main_color_piece[1]));
    }

    //Déterminer si le joueur courrant est le premier joueur à jouer
    setStartingPlayer() {
        this.playerIndex = 0;
    }

    //Changer un pseudo de joueur
    setPlayerDatas(id, pseudo) {
        let p = players[id];
        p.UI_setName(pseudo);
    }

    //Déterminer l'index du joueur courrant
    setPlayerIndex(id) {
        this.playerIndex = id;
    }

    //Lancer la partie de jeu
    start() {
        //Init the board
        this.players = this.board.initGameInstances();

        //Initialise all DB structures for online managing
        this.initialiseDataBase();
        //Loading Pseudo player
        this.initialiseDataPlayer();
        //Loading Avatar Image
        this.downloadFilePlayer1(player1);
        this.downloadFilePlayer2(player2);


        //Clear the board
        this.board.clear();

        this.currentPlayer = this.players[this.playerIndex];

        this.turnPlayerListerner();

        if (this.startANewTurn()) {
            this.onEndingGame();
        } else {
            this.computeOnclkListener();
        }
    }

    //Lancer un tour de jeu
    startANewTurn() {
        //if we were the last player to play, then MAJ db first with our play
        if (this.isMyTurn && this.nbTurn != 0) {
            for (let s of this.allShots.peek()) {
                this.onCurrentPlayerPlay(new DB_Shots(s.startPos, s.endPos, s.IDTransformedPiece));
            }
            this.SyncToDB();
        }


        //MAJ turn to play
        this.isMyTurn = (this.playerIndex == (this.nbTurn % this.players.length));
        //Stop game if needed
        this.gameStopped = !this.isMyTurn;

        //Maj UI for better understanding in interface of current player
        this.majLayoutPlayerTurn(this.getCurrentPlayer());

        //if its not your turn, don't try to compute anything
        if (this.isMyTurn) {
            //Next we can compute the special rock movement
            this.computeRockInGame(this.currentPlayer);
            //We create all the movement for all the players
            for (let p of this.players) {
                this.computePossibleMvts(p);
            }
            //And we restrict the current player movements if he is in danger
            this.performMenaced(this.currentPlayer);

            //We can independently compute the dangerous Case by calculating the possible position for each dangerous enemy neighbour
            this.performDanger(this.currentPlayer);

            //MAJ NUMBER OF TURNS
            return this.isFinished();
        }

        //MAJ NUMBER OF TURNS
        //nbTurn++;
        //Not your turn, so you are still able to play in theory
        return false;
    }

    SyncToDB(){}

    //Jouer les coups ennemis dans notre instance courrante de jeu
    playAllEnemyShots() {
        if (!this.shotsToPerform.length === 0) {
            if (this.shotsToPerform.length == 1) {

                let startPos = this.shotsToPerform[0].startPosPlayerPlay;
                let endPos = this.shotsToPerform[0].endPosPlayerPlay;
                let idTransform = this.shotsToPerform[0].IDTransformedPiece;

                let c = this.board.getACase(startPos.x, startPos.y);
                //Perform move
                //We need to perform a variant of the shot with move animation
                if (ANIMATION_PIECE) {
                    //Animation
                    this.moveAPiece_animated(startPos, endPos, false);
                } else {
                    //No animation
                    let pMoved = this.moveAPiece(startPos, endPos, false);
                    this.nbTurn++;
                    //Start a new turn
                    if (this.startANewTurn()) {
                        //If its finished, then stop the treatment
                        this.onEndingGame();
                    }
                }
                //Perform transformation (if needed)
            } else {
                //rock move
                let startPos_king = this.shotsToPerform[0].startPosPlayerPlay;
                let endPos_king = this.shotsToPerform[0].endPosPlayerPlay;

                let startPos_tower = this.shotsToPerform[1].startPosPlayerPlay;
                let endPos_tower = this.shotsToPerform[1].endPosPlayerPlay;

                let start_case_tower = this.board.getACase(startPos_tower.x, startPos_tower.y);

                let tower = start_case_tower.piece;
                let as = new Association_rock(tower, startPos_tower, endPos_king, endPos_tower);

                //We need to perform a variant of the shot with move animation
                if (ANIMATION_PIECE) {
                    //Animation
                    this.moveAPiece_animated_rock(startPos_king, as);
                } else {
                    //No animation
                    this.moveAPiece_rock(startPos_king, as);
                    this.nbTurn++;
                    //Start a new turn
                    if (this.startANewTurn()) {
                        //If its finished, then stop the treatment
                        this.onEndingGame();
                    }
                }
            }
        } else {
            //This meaning that the player that need to play didn't play anything
            //Because : Loose
            //          Pat
            //          FF

            this.currentPlayer = this.players[1 - this.playerIndex];

            for (let p of players) {
                this.computePossibleMvts(p);
            }

            //Compute local winner
            super.onEndingGame();
            if (this.playerIndex == 1) {
                //Set the data in DB for all players
                let eloDiff = eloInflated(this.eloPlayer2, this.eloPlayer1, this.player2, true);
                addHistoryGame(this.player2, this.nbTurn, "win", this.pseudoPlayer1, eloDiff);

                let eloDiff2 = eloInflated(this.eloPlayer2, this.eloPlayer1, this.player1, false);
                addHistoryGame(this.player1, this.nbTurn, "loose", this.pseudoPlayer2, eloDiff2);
            } else {
                //Set the data in DB for all players
                let eloDiff = eloInflated(this.eloPlayer2, this.eloPlayer1, this.player1, true);
                addHistoryGame(this.player1, this.nbTurn, "win", this.pseudoPlayer2, eloDiff);

                let eloDiff2 = eloInflated(this.eloPlayer2, this.eloPlayer1, this.player2, false);
                addHistoryGame(this.player2, this.nbTurn, "loose", this.pseudoPlayer1, eloDiff2);
            }
        }
        this.shotsToPerform.clear();
    }

    //Quand la partie se termine
    onEndingGame() {
        super.onEndingGame();
        roomRef.child("loose").setValue("yes");
        roomRef.child("turn").setValue(2 - playerIndex);
    }

    //Initialiser l'image de profil du joueur ID
    setImage(id, uri) {
        console.log(this.players);
        this.players[id].UI_setPorfilPicFromLocalFile(uri);
    }


    /** =======================================================
     *              DATABASE INTERACTIONS
     *  ======================================================= **/

    //Initialiser les données des deux joueurs (appel lecture DB)
    initialiseDataPlayer() {
    }

    //Quand un joueur ennemi va jouer un coup
    //On doit récupérer ces informations pour pouvoir les jouer ensuite
    onEnemyPlayerPlay() {
    }

    //Quand le joueur courrant va jouer un coup
    //On doit mettre à jour la DB pour renseigner les coups joués
    onCurrentPlayerPlay(d) {
        this.shotsToPush.add(d);
    }


    setNameRoomRef(nameRoomRef) {
        this.nameRoomRef = nameRoomRef;
    }

    initialiseDataBase() {
        //Init all the DB
    }

    turnPlayerListerner() {
        //Compute player listener on DB change
    }

    //Return the elo loose or win for the history game
    eloInflated(database, eloWinner, eloLooser, player, winner) {
        //Do random number between 5 and 15
        let randomNumber = Math.random() * 10 + 5;

        let eloWin = 0;
        let eloLoose = 0;

        if (eloWinner < eloLooser) {
            let eloCoefDiff = (eloLooser - eloWinner) / 3;
            //Limiter l'apport de la différence de points de victoire des deux joueurs
            eloCoefDiff = (eloCoefDiff < 0) ? 0 : (eloCoefDiff > 15) ? 15 : eloCoefDiff;
            eloWin = eloCoefDiff + randomNumber * 2;
            eloLoose = eloCoefDiff + (randomNumber * 1.5);
        } else {
            let eloCoefDiff = (eloLooser - eloWinner) / 5;
            //Limiter l'apport de la différence de points de victoire des deux joueurs
            eloCoefDiff = (eloCoefDiff < 0) ? 0 : (eloCoefDiff > 15) ? 15 : eloCoefDiff;
            eloWin = eloCoefDiff + randomNumber * 0.5;
            eloLoose = eloCoefDiff + randomNumber * 0.25;
        }

        if (winner) {
            database.getReference().child("users").child(player).child("elo").setValue(eloWinner + eloWin);
            return eloWin;
        } else {
            database.getReference().child("users").child(player).child("elo").setValue(eloLooser - eloLoose);
            return -eloLoose;
        }
    }

    downloadFilePlayer1(player) {
        //Get all player 1 element
    }

    downloadFilePlayer2(player) {
        //Get all player 2 element
    }


    addHistoryGame(player, nbCoup, haveWin, opponent, eloDiff) {
        //Save the finish game instance
    }

    deleteRoomsInformation() {
        //Delete the room
    }

    //Function called to end a turn and sync datas to other players
    SyncToDB(shotsToPush, playerIndex) {
    }
}

