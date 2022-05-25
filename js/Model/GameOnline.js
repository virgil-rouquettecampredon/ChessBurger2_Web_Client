/* ==================================================================================
    GAME ONLINE BEHAVIORS
================================================================================== */
import {animation_duration, Association_rock, GameManager, Shot} from "./Game.js";
import {Board, main_color_piece, TransformPieces} from "./Board.js";
import {Piece,King,Bishop,Pawn,Queen,Knight,Tower} from "./Piece.js";
import {Player} from "./Player.js";
import {MovementPiece, Movement} from "./Movement.js";
import {downloadFileOnline} from "../../firebasStorage.js";
import {deleteRoom, writeEloWinOrLoss, takePseudoAndElo,turnListener,SyncToDataBase} from "../../index.js";
import {AnimatorBoard} from "./animator.js";
/**================================================================================== */


//Coups en DB plus légers
export class DB_Shots{
    constructor(startPosPlayerPlay, endPosPlayerPlay, IDTransformedPiece) {
        this.startPosPlayerPlay = startPosPlayerPlay;
        this.endPosPlayerPlay = endPosPlayerPlay;
        this.IDTransformedPiece = IDTransformedPiece;
    }
}

//Gestionnaire de partie de jeu
export class GameManagerOnline extends GameManager {
    constructor(board, roomNameRef) {
        super(board);
        this.shotsToPush = [];
        this.shotsToPerform = [];
        this.gameStopped = true;

        this.roomNameRef = roomNameRef;
        this.allPlayarsSet = false;

        this.nbCurP = 0;
    }

    //Déterminer si le joueur courrant est le premier joueur à jouer
    setStartingPlayer() {
        this.playerIndex = 0;
    }

    addAPlayerToTheRoom(uid) {
        console.log("ADD A PLAYER : " + uid);
        let curpToMAJ = this.players[this.nbCurP];
        let curIndexP = this.nbCurP;
        this.nbCurP++;

        //console.log(curpToMAJ);

        curpToMAJ.UID = uid;
        curpToMAJ.indexDB = this.nbCurP;
        curpToMAJ.UI.onWaitingPlayer.style.display = "none";

        //On charge ensuite toutes les informations importantes de lancement de partie
        //Récupération de l'élo et du pseudo
        let obj = this;
        takePseudoAndElo(uid, (pseudo, elo) => {
            curpToMAJ.UI_setName(pseudo);
            curpToMAJ.elo = elo;
        });

        //Récupération de la photo de profil
        let url = downloadFileOnline(uid).then(function (url) {
            obj.setImage(curIndexP, url)
        });
    }

    initParty(needToStart) {
        console.log("INIT PARTY");
        //Clear and draw the empty board
        this.board.clear(true);
        this.board.drawBoard();
        //Init the board with players informations
        this.players = this.board.initGameInstances("en attente", "en attente");
    }

    //Lancer la partie de jeu
    start() {
        this.gameStopped = false;
        this.currentPlayer = this.players[this.playerIndex];

        console.log(" => START THE GAME !");
        //console.log(this.players);
        //console.log(this.roomNameRef);
        //console.log(this.playerIndex);

        //On construit le listener pour lire les coups joués par l'adversaire
        turnListener(this.roomNameRef, this.playerIndex, this);
        //turnListenerBis(this.currentPlayer);

        //On lance le tour
        if (this.startANewTurn()) {
            this.onEndingGame();
        } else {
            this.computeOnclkListener();
        }
    }

    //Lancer un tour de jeu
    startANewTurn() {
        console.log("=============== START A NEW TURN ==================");
        //if we were the last player to play, then MAJ db first with our play
        if (this.isMyTurn && this.nbTurn != 0) {

            console.log("MAJ PLAY");
            for (let s of this.allShots.peek()) {
                console.log(s);
                this.onCurrentPlayerPlay(new DB_Shots(s.startPos, s.endPos, s.IDTransformedPiece));
            }
            SyncToDataBase(this.roomNameRef, this.playerIndex, this.shotsToPush);
        }
        //MAJ turn to play
        this.isMyTurn = (this.playerIndex == (this.nbTurn % this.players.length));

        //Stop game if needed
        this.gameStopped = !this.isMyTurn;

        //console.log(this.board);

        //Maj UI for better understanding in interface of current player
        this.majLayoutPlayerTurn(this.players[this.nbTurn % this.players.length]);

        //if its not your turn, don't try to compute anything
        if (this.isMyTurn) {
            //this.nbTurn++;
            console.log("==== MY TURN ====");
            //console.log("==== ROCK ====");
            //Next we can compute the special rock movement
            this.computeRockInGame(this.currentPlayer);
            //We create all the movement for all the players
            for (let p of this.players) {
                this.computePossibleMvts(p);
            }
            //console.log("==== MENACE ====");
            //And we restrict the current player movements if he is in danger
            this.performMenaced(this.currentPlayer);

            //We can independently compute the dangerous Case by calculating the possible position for each dangerous enemy neighbour
            this.performDanger(this.currentPlayer);

            //MAJ NUMBER OF TURNS
            return this.isFinished();
        } else {
            //For menace treatment
            for (let pos of this.positionWithDanger) {
                if (this.board.isGoodPos(pos.x, pos.y)) {
                    this.board.setPossibleCaseWithMenaceOnIt(pos.x, pos.y, false);
                }
            }
            this.cptMenace(this.players[this.nbTurn % this.players.length])
            console.log("==== NOT MY TURN ====");
        }

        //Not your turn, so you are still able to play in theory
        return false;
    }

    //Jouer les coups ennemis dans notre instance courrante de jeu
    playAllEnemyShots() {
        //console.log("PLAY ALL ENNEMY SHOTS");
        //console.log(this.shotsToPerform);
        //console.log("========================");

        if (this.shotsToPerform.length !== 0) {
            //console.log("=> MORE THAN ZERO ELEM")
            if (this.shotsToPerform.length == 1) {
                //console.log("=> ONE ELEM")

                let startPos = this.shotsToPerform[0].startPosPlayerPlay;
                let endPos = this.shotsToPerform[0].endPosPlayerPlay;
                let idTransform = this.shotsToPerform[0].IDTransformedPiece;

                let c = this.board.getACase(startPos.x, startPos.y);
                let pieceToMove = c.piece;

                //Perform move
                //We need to perform a variant of the shot with move animation
                if (ANIMATION_PIECE) {
                    //Animation
                    this.moveAnEnnemyPiece_animated(startPos, endPos, false, idTransform);
                } else {

                    //No animation
                    let pMoved = this.moveAPiece(startPos, endPos, false);
                    this.nbTurn++;

                    //Perform transformation (if needed)
                    if (idTransform >= 0) {
                        let ennemy = this.players[(1 - this.playerIndex)];
                        this.transformEnnemyPiece(ennemy, idTransform, pieceToMove, endPos);
                    }

                    //MAJ UI Board for players
                    this.board.commitChanges();

                    //Start a new turn
                    if (this.startANewTurn()) {
                        //If its finished, then stop the treatment
                        this.onEndingGame();
                    }
                }
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
                    this.board.commitChanges();

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

            for (let p of this.players) {
                this.computePossibleMvts(p);
            }

            //Compute local winner
            super.onEndingGame();
            if (this.playerIndex == 1) {
                //Set the data in DB for all players

                let eloDiff = eloInflated(this.eloPlayer2, this.eloPlayer1, this.player2, true);
                this.addHistoryGame(this.player2, this.nbTurn, "win", this.pseudoPlayer1, eloDiff);

                let eloDiff2 = eloInflated(this.eloPlayer2, this.eloPlayer1, this.player1, false);
                this.addHistoryGame(this.player1, this.nbTurn, "loose", this.pseudoPlayer2, eloDiff2);
            } else {
                //Set the data in DB for all players
                let eloDiff = eloInflated(this.eloPlayer2, this.eloPlayer1, this.player1, true);
                this.addHistoryGame(this.player1, this.nbTurn, "win", this.pseudoPlayer2, eloDiff);

                let eloDiff2 = eloInflated(this.eloPlayer2, this.eloPlayer1, this.player2, false);
                this.addHistoryGame(this.player2, this.nbTurn, "loose", this.pseudoPlayer1, eloDiff2);
            }
        }

        this.shotsToPerform = [];
    }

    transformEnnemyPiece(player, id, oldP, pos) {
        let newP = undefined;
        switch (id) {
            case  TransformPieces.TOWER :
                newP = Tower.CreateWithCloningAndAppearance(
                    true,
                    oldP,
                    player.pieceTOTransformSrc.tower.appearance
                );
                break;
            case TransformPieces.QUEEN :
                newP = Queen.CreateWithCloningAndAppearance(
                    true,
                    oldP,
                    player.pieceTOTransformSrc.queen.appearance
                );
                break;
            case TransformPieces.KNIGHT :
                newP = Knight.CreateWithCloningAndAppearance(
                    true,
                    oldP,
                    player.pieceTOTransformSrc.knight.appearance
                );
                break;
            case TransformPieces.BISHOP :
                newP = Bishop.CreateWithCloningAndAppearance(
                    true,
                    oldP,
                    player.pieceTOTransformSrc.bishop.appearance
                );
                break;
        }
        this.board.setAPieces(pos.x, pos.y, newP);
        //player piece destruction
        oldP.possessor.destroyAPiece(oldP);
        //Maj last shot Piece Transformation
        this.allShots.peek()[0].IDTransformedPiece = id;
    }

    moveAnEnnemyPiece_animated(start, end, lightMove, idTransform) {
        //Move a piece form start position to end position with animation

        //Stop the onclk
        this.gameStopped = true;

        let start_case = this.board.getACase(start.x, start.y);
        let end_case = this.board.getACase(end.x, end.y);

        let moved = start_case.piece;
        let possibly_eaten = end_case.piece;

        let s = new Shot(moved, start, end, possibly_eaten, !lightMove, !moved.movedYet);
        this.allShots.push([s]);

        let animator = new AnimatorBoard(animation_duration, this.board);

        let obj = this;
        animator.onStart = function () {
            obj.board.setAPieces(start_case.col, start_case.row, undefined);
        }

        animator.onEnd = function () {
            obj.board.clear();
            obj.board.drawBoard();

            //Visual animation ending
            obj.board.restart_no_animation_context();

            //All the game ending, and also mechanism to preform another round
            //Piece ate mechanism
            if (possibly_eaten !== undefined) {
                //If there is a  piece at the direction of displacement, its eaten
                let pAte = obj.eatAPiece(possibly_eaten);

                //We MAJ the cimetary visual after
                if (pAte !== undefined && !lightMove) {
                    obj.addCimetaryLayout(pAte, possibly_eaten);
                }
            }

            //Perform the complete movement
            obj.board.setAPieces(end_case.col, end_case.row, moved);
            moved.movedYet = true;

            //Cancel pause moment
            obj.gameStopped = false;

            if (idTransform >= 0) {
                let ennemy = obj.players[(1 - obj.playerIndex)];
                obj.transformEnnemyPiece(ennemy, idTransform, moved, end);
            }

            obj.onFinishTurn();
            //Else go through a normal treatment
            //Go through another round and start a new turn
            if (obj.startANewTurn()) {
                //If its finished, then stop the treatment
                obj.board.commitChanges();
                obj.onEndingGame();
            }
            obj.board.commitChanges();
        }
        //Animation function to call for perform a smooth displacement of the piece and not a teleportation
        this.board.animatedDisplacement([start_case], [end_case], 1, animator);
    }

    //Quand la partie se termine
    onEndingGame() {
        super.onEndingGame();
        roomRef.child("loose").setValue("yes");
        roomRef.child("turn").setValue(2 - playerIndex);
    }

    //Initialiser l'image de profil du joueur ID
    setImage(id, uri) {
        console.log("SET IMAGE : " + id);
        this.players[id].UI_setPorfilPicFromLocalFile(uri);
    }

    //Quand le joueur courrant va jouer un coup
    //On doit mettre à jour la DB pour renseigner les coups joués
    onCurrentPlayerPlay(d) {
        this.shotsToPush.push(d);
    }


    /** =======================================================
     *              DATABASE INTERACTIONS
     *  ======================================================= **/
    deleteRoomsInformation() {
        //Delete the room
        deleteRoom(this.roomNameRef);
    }
}


//Return the elo loose or win for the history game
function eloInflated(eloWinner, eloLooser, player, winner) {
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
        writeEloWinOrLoss(player, eloWinner + eloWin);
        return eloWin;
    } else {
        writeEloWinOrLoss(player, eloLooser - eloLoose);
        return -eloLoose;
    }
}