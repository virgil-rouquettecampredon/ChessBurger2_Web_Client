/* ==================================================================================
    GAME BEHAVIORS
================================================================================== */

//TODO CHECK THAT
let ANIMATION_PIECE                 = false;
let animation_duration              = .5;

let affichage                       = false;


class Shot {
    constructor(pieceConcerned, startPos, endPos, eatedPiece, majAff, firstMoove) {
        this.pieceConcerned = pieceConcerned;
        this.startPos = startPos;
        this.endPos = endPos;
        this.eatedPiece = eatedPiece;

        this.firstMoove = firstMoove;
        this.majAff = majAff;

        this.IDTransformedPiece = -1;
    }
}

class Association_rock {
    constructor(p, posPieceToRockWith, p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
        this.posPieceToRockWith = posPieceToRockWith;
        this.pieceToRockWith = p;
    }
}


class GameManager {
    constructor(board) {
        this.board = board;
        this.players = [];
        this.lastPossiblePositions = [];

        this.allShots = [];
        this.gameStopped = false;

        this.positionWithDanger = [];
        this.rockPiecePositons = new Map();


        this.currentPlayer = undefined;
        this.lastPossiblePositions = [];
        this.lastPosOfPieceSelected = undefined;
        this.lastPosPreSelected = undefined;

        this.nbTurn = 0;
    }

    initDOMElementsRoot(elem) {
        this.constructPlayerLayout(elem);
    }

    /**
     * ======== For launch and play a game ========
     **/
    start() {
        console.log("START THE GAME");

        //Clear and draw the empty board
        this.board.clear(true);
        this.board.drawBoard();

        //Init the board
        this.players = this.board.initGameInstances();

        if (this.startANewTurn()) {
            this.onEndingGame();
        } else {
            this.computeOnclkListener();
        }
    }

    //Get case from x-y coord
    fromCanvasCoordLinearToCaseInstance(x, y) {
        //console.log("FROM CANVAS : (" + x + "," + y + ")");
        //console.log("nb row : " + this.board.nb_row);
        //console.log("nb col : " + this.board.nb_col);

        let row = Math.floor(y * this.board.nb_row);
        let col = Math.floor(x * this.board.nb_col);

        //console.log("TO CASE : (" + col + "," + row + ")");
        return this.board.getACase(col, row);
    }

    fromCaseInstanceToBoundsCoord(col, row) {
        let w = this.board.UI.canvas.width;
        let h = this.board.UI.canvas.height;

        return {
            left: w / this.board.nb_col * col,
            right: w / this.board.nb_col * (col + 1),
            top: h / this.board.nb_row * row,
            bottom: h / this.board.nb_row * (row + 1)
        }
    }

    //Function for complete the main onclick listener of the board app
    computeOnclkListener() {
        //Onclick for the game core
        let obj = this;

        //console.log("ONCLK LISTENER");
        //console.log(this.board.UI.canvas);

        this.board.UI.canvas.addEventListener('click', function(event) {
            console.log("CLICK ON THE BOARD !");
            //console.log(event);

            if (!obj.gameStopped) {

                //Get coord when onclick
                let coord = getLinearCursorPosition(obj.board.UI.canvas, event);

                console.log(coord);

                let c = obj.fromCanvasCoordLinearToCaseInstance(coord.xcoord, coord.ycoord);
                let p = c.piece;
                let as = c.rock_elem;

                //console.log(c);
                //console.log(p);
                //console.log(as);
                //console.log("========== START COMPUTING !");

                //If the case was selected the round just before by the player
                if (c.pre_selected_pos) {
                    //Perform the mouvement
                    //Clear the preselected positions
                    obj.board.setPossiblePreSelectedPos(obj.lastPosPreSelected.x, obj.lastPosPreSelected.y, false);

                    //=========================
                    //  CLEAR ALL THE POSITIONS
                    //========================
                    //Clear all the possibles moves
                    for (let pos of obj.lastPossiblePositions) {
                        obj.board.setPossiblePos(pos.x, pos.y, false);
                        obj.board.setPossiblePosRock(pos.x, pos.y, undefined);
                    }
                    obj.lastPossiblePositions = [];

                    //If we select a position with no rock behavior
                    if (as === undefined) {
                        //We need to perform a variant of the shot with move animation
                        if (ANIMATION_PIECE) {
                            //Animation
                            obj.moveAPiece_animated(obj.lastPosOfPieceSelected, obj.lastPosPreSelected, false);
                            obj.lastPosPreSelected = undefined;
                        } else {
                            //No animation
                            let pMoved = obj.moveAPiece(obj.lastPosOfPieceSelected, obj.lastPosPreSelected, false);

                            console.log("PIECE MOVED");
                            console.log(pMoved);

                            //We need to check if the movement need an upgrade treatment
                            if (c.is_end_case && pMoved.canBeTransformed()) {
                                //Launch the upgrade treatment
                                obj.transformAPiece(pMoved, obj.lastPosPreSelected);
                                obj.lastPosPreSelected = undefined;
                            } else {
                                obj.lastPosPreSelected = undefined;
                                //Start a new turn
                                if (obj.startANewTurn()) {
                                    //If its finished, then stop the treatment
                                    obj.onEndingGame();
                                }
                            }
                        }
                    } else {
                        //We need to perform a variant of the shot with move animation
                        if (ANIMATION_PIECE) {
                            //Animation
                            obj.moveAPiece_animated_rock(obj.lastPosOfPieceSelected, as);
                            obj.lastPosPreSelected = undefined;
                        } else {
                            //No animation
                            obj.moveAPiece_rock(obj.lastPosOfPieceSelected, as);
                            obj.lastPosPreSelected = undefined;
                            //Start a new turn
                            if (obj.startANewTurn()) {
                                //If its finished, then stop the treatment
                                obj.onEndingGame();
                            }
                        }
                    }
                } else {
                    //Clear the last preselected position
                    if (obj.lastPosPreSelected !== undefined) {
                        obj.board.setPossiblePreSelectedPos(obj.lastPosPreSelected.x, obj.lastPosPreSelected.y, false);
                    }

                    //Then it could be a possible movement case
                    if (c.possible_pos) {
                        //Then this case is transformed on a pre-selected case
                        obj.lastPosPreSelected = new Position(c.col, c.row);
                        obj.board.setPossiblePreSelectedPos(obj.lastPosPreSelected.x, obj.lastPosPreSelected.y, true);
                    } else {
                        //Then this case may just contain a piece on it

                        //=========================
                        //  CLEAR ALL THE POSITIONS
                        //=========================
                        //Delete precedent position seen
                        for (let pos of obj.lastPossiblePositions) {
                            obj.board.setPossiblePos(pos.x, pos.y, false);
                            obj.board.setPossiblePosRock(pos.x, pos.y, undefined);
                        }
                        obj.lastPossiblePositions = [];


                        if (p !== undefined) {
                            //Click on a piece on the board
                            //Send new positions player wanted to see
                            let posPos = obj.currentPlayer.getPositionsPiece(p);
                            for (let pos of posPos) {
                                obj.lastPossiblePositions.push(pos);
                                obj.board.setPossiblePos(pos.x, pos.y, true);
                            }

                            //Set potentially rock positions
                            //console.log(obj.rockPiecePositons);

                            let pos_rock = obj.rockPiecePositons.get(p);
                            if (pos_rock !== undefined) {
                                for (let aRock of pos_rock) {
                                    let pRock = aRock.p1;
                                    obj.lastPossiblePositions.push(pRock);
                                    obj.board.setPossiblePosRock(pRock.x, pRock.y, aRock);
                                    obj.board.setPossiblePos(pRock.x, pRock.y, true);
                                }
                            }

                            //For save an historic of precedents choices
                            obj.lastPosOfPieceSelected = new Position(c.col, c.row);
                        }
                    }
                }

                //Draw the changes
                obj.board.commitChanges();
            }
        }, false);
    }

    //Function for complete the main onclick listener of the board app
    startANewTurn() {
        //console.log("======================================");
        console.log("=========================================== START A NEW TURN : " + this.nbTurn);

        this.currentPlayer = this.getCurrentPlayer();
        console.log(this.currentPlayer);

        //Maj UI for better understanding in interface of current player
        this.majLayoutPlayerTurn(this.currentPlayer);
        //Next we can compute the special rock movement
        this.computeRockInGame(this.currentPlayer);

        //affichage = true;
        //console.log(" ++ COMPUTE POSSIBLE MOVEMENTS ++ ");
        //We create all the movement for all the players

        this.computePossibleMvts(this.currentPlayer);
        for (let p of this.players) {
            this.computePossibleMvts(p);
        }
        affichage = false;

        //console.log(" ++ PERFORM MENACE ++ ");
        //And we restrict the current player movements if he is in danger
        this.performMenaced(this.currentPlayer);

        //console.log(" ++ PERFORM DANGER ++ ");
        //We can independently compute the dangerous Case by calculating the possible position for each dangerous enemy neighbour
        this.performDanger(this.currentPlayer);

        this.board.commitChanges();

        this.nbTurn++;
        //console.log("======================================");
        return this.isFinished();
    }

    //=== PLAYERS MANAGEMENT ===
    //Get the ind of a player in the game
    getIndex(player) {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i] === player) return i;
        }
        return -1;
    }

    //Get a player who get the Piece piece
    getPlayer(piece) {
        return piece.possessor;
    }

    //For getting the current player to play
    getCurrentPlayer() {
        return this.players[this.nbTurn % this.players.length];
    }

    /**
     * ======== For game stopping mechanics ========
     **/
    isFinished() {
        //Detect if current player can still perform at least one movement
        for (let p of this.currentPlayer.getPiecesPlayer()) {
            if (this.currentPlayer.getPositionsPiece(p).length > 0) return false;
        }
        return true;
    }

    onEndingGame() {
        console.log("GAME IS FINISH !");

        let mes_start = "Partie termininée";
        let mes_mid = "";
        let mes_end = "";

        //Perform the end of the game
        if (this.isMenaced(this.currentPlayer)) {
            let playersWin = [];
            for (let p of this.players) {
                if (!p.isAlly(this.currentPlayer)) {
                    playersWin.push(p);
                }
            }
            if (playersWin.length === 1) {
                mes_mid = playersWin[0].pseudo;
                mes_end = "a gagné";
            } else {
                let res = "";
                for (let p of playersWin) {
                    res += p.pseudo + "-";
                }
                res = res.substring(0, res.length - 1);
                mes_mid = res;
                mes_end = "ont gagné";
            }
        } else {
            mes_mid = "";
            mes_end = "égalité";
        }

        this.board.onEndOfGame(mes_start, mes_mid, mes_end);
    }


    /**
     * ======== For game menace mechanics ========
     **/
    isMenaced(playerCurrent) {
        for (let piece of playerCurrent.getPiecesPlayer()) {
            if (piece.isVictoryCondition()) {
                for (let p of this.players) {
                    if (!playerCurrent.isAlly(p)) {
                        for (let pieceEnemy of p.getPiecesPlayer()) {
                            for (let eatable of pieceEnemy.tastyPieces) {
                                if (eatable === piece) {
                                    //If pieceEnemy menace our victoryPieceCondition
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    //For getting all the piece that menace our victory condition piece
    cptMenace(playerCurrent) {
        //Res of the search
        for (let piece of playerCurrent.getPiecesPlayer()) {
            if (piece.isVictoryCondition()) {
                for (let p of this.players) {
                    if (!playerCurrent.isAlly(p)) {
                        for (let pieceEnemy of p.getPiecesPlayer()) {
                            for (let eatable of pieceEnemy.tastyPieces) {
                                if (eatable === piece) {
                                    //If pieceEnemy menace our victoryPieceCondition
                                    this.positionWithDanger.push(this.board.getPiecePosition(pieceEnemy));
                                    this.positionWithDanger.push(this.board.getPiecePosition(piece));
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    performMenaced(player) {
        //Get all current pos of pieces on the board
        let posPiecesStart = new Map();

        for (let piece of player.getPiecesPlayer()) {
            posPiecesStart.set(piece, this.board.getPiecePosition(piece));
        }

        //console.log("======= PERFORM MENACE =======");
        //console.log(player);
        //console.log(posPiecesStart);


        let posPieces = new Map();
        for (let piece of player.getPiecesPlayer()) {
            posPieces.set(piece, []);
            for (let pos of player.getPositionsPiece(piece)) {
                posPieces.get(piece).push(pos);
            }
        }

        let obj = this;

        let pArray = Array.from(posPieces.keys());

        //console.log("FILTER POSITIONS !");

        for (let piece of pArray) {
            let positions = posPieces.get(piece);

            //console.log(positions);
            let newP = [];
            if (positions !== undefined) {
                positions.forEach((value) => {
                    let pos = value;
                    //console.log(pos);

                    //We perform the movement
                    let startPos = posPiecesStart.get(piece);

                    obj.moveAPiece(startPos, pos, true);

                    for (let gamePlayer of obj.players) {
                        obj.computePossibleMvts(gamePlayer);
                    }

                    //Now check if there is still a chess state
                    let res = this.isMenaced(player);
                    let ls = obj.cancelAShot();
                    if(!res) newP.push(value);
                })
            }

            //console.log("RES : ");
            //console.log(newP);
            posPieces.set(piece,newP);
        }

        //console.log("POSITION PIECES");
        //console.log(posPieces);

        //Now we can update all the possible move from all players
        for (let gamePlayer of this.players) {
            this.computePossibleMvts(gamePlayer);
        }

        player.resetPossibleMove();
        //And after for all our possible movement calculated before for our menaced player


        pArray = Array.from(posPieces.keys());
        for (let piece of pArray) {
            let positions = posPieces.get(piece);
            if (positions !== undefined) {
                player.setPossibleMove(piece, positions);
            }
        }

        //console.log("======= PERFORM MENACE END =======");
    }

    performDanger(player) {
        //First reset the precedent treatment
        for (let pos of this.positionWithDanger) {
            if (this.board.isGoodPos(pos.x, pos.y)) {
                this.board.setPossibleCaseWithMenaceOnIt(pos.x, pos.y, false);
            }
        }
        this.positionWithDanger = [];
        //Then cpt the new menace
        this.cptMenace(player);

        //And finally maj the UI
        for (let pos of this.positionWithDanger) {
            if (this.board.isGoodPos(pos.x, pos.y)) {
                this.board.setPossibleCaseWithMenaceOnIt(pos.x, pos.y, true);
            }
        }
    }


    /**
     * ======== For movements computation ========
     **/
    //For perform a movement on the board (lightMove = true -> move that will be canceled just after : no UI modif, no anim performed ...)
    moveAPiece(start, end, lightMove) {
        //Move a piece form start position to end position

        let start_case = this.board.getACase(start.x, start.y);
        let end_case = this.board.getACase(end.x, end.y);

        let moved = start_case.piece;
        let possibly_eaten = end_case.piece;

        this.allShots.push([new Shot(moved, start, end, possibly_eaten, !lightMove, !moved.movedYet)]);

        if (possibly_eaten !== undefined) {
            //If there is a  piece at the direction of displacement, its eaten
            let pEated = this.eatAPiece(possibly_eaten);

            //We MAJ the cimetary visual after
            if (pEated !== undefined && !lightMove) {
                this.addCimetaryLayout(pEated, possibly_eaten);
            }
        }

        this.board.setAPieces(start_case.col, start_case.row, undefined);
        this.board.setAPieces(end_case.col, end_case.row, moved);
        moved.movedYet = true;
        return moved;
    }

    //For perform a movement with an animation
    moveAPiece_animated(start, end, lightMove) {
        //Move a piece form start position to end position with animation

        //Stop the onclk
        this.gameStopped = true;

        let start_case = this.board.getACase(start.x, start.y);
        let end_case = this.board.getACase(end.x, end.y);

        let moved = start_case.piece;
        let possibly_eaten = end_case.piece;

        let s = new Shot(moved, start, end, possibly_eaten, !lightMove, !moved.movedYet);
        this.allShots.push([s]);

        let animator = new AnimatorBoard(animation_duration, this);

        let obj = this;
        animator.onStart = new function () {
            obj.board.setAPieces(start_case.col, start_case.row, undefined);
        }

        animator.onEnd = new function () {
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

            //We need to check if the movement need an upgrade treatment
            if (end_case.is_end_case && moved.canBeTransformed()) {
                //Launch the upgrade treatment
                obj.transformAPiece(moved, end);
            } else {
                //Else go through a normal treatment
                //Go through another round and start a new turn
                if (obj.startANewTurn()) {
                    //If its finished, then stop the treatment
                    obj.board.commitChanges();
                    obj.onEndingGame();
                }
            }
            obj.board.commitChanges();
        }
        //Animation function to call for perform a smooth displacement of the piece and not a teleportation
        this.board.animatedDisplacement([start_case], [end_case], 1, animator);
    }

    //For canceling the last shot performed on the game
    cancelAShot() {
        let sList = this.allShots.pop();
        for (let s of sList) {
            //If the last shot was to eat a piece
            if (s.eatedPiece !== undefined) {
                let p = this.reviveAPiece(s.eatedPiece);
                //If we also maj cimetary layout
                if (p !== undefined && s.majAff) {
                    this.popCimetaryLayout(s.eatedPiece.possessor);
                }
            }

            //Cancel the moove
            this.board.setAPieces(s.startPos.x, s.startPos.y, s.pieceConcerned);
            this.board.setAPieces(s.endPos.x, s.endPos.y, s.eatedPiece);
            s.pieceConcerned.movedYet = !s.firstMoove;
        }
        return sList;
    }

    //For perform the in/out piece mechanism on the board
    eatAPiece(piece) {
        let p = this.getPlayer(piece);
        if (p !== undefined) {
            p.killAPiece(piece);
        }
        return p;
    }

    reviveAPiece(piece) {
        let p = this.getPlayer(piece);
        //console.log("REVIVE A PIECE !");
        //console.log(piece);
        //console.log(p);

        if (p !== undefined) {
            p.reviveAPiece(piece);
        }
        return p;
    }

    //Computing the possible movement that can perform the pieces of the player
    computePossibleMvts(player) {
        if(affichage) {
            console.log("=======================================");
            console.log("COMPUTE POSSIBLE MOVES PLAYER");
            console.log(player);
        }
        //First reset all the precedent moves
        player.resetPossibleMove();

        let pieces_player = player.getPiecesPlayer();

        if(affichage) {
            console.log("Pieces player : ");
            console.log(pieces_player);
        }

        for (let p_player of pieces_player) {
            if(affichage) {
                console.log(" ===================================== ");
                console.log("    => piece to watch : ");
                console.log(p_player);
            }

            //Don't forget to clear that list for reset the menace
            p_player.clearTastyPieces();

            //Compute classic movements
            let piece_pos   = this.board.getPiecePosition(p_player);
            let mvt_pp      = p_player.getAllPossibleMvt(piece_pos.x, piece_pos.y);

            if(affichage) {
                console.log(piece_pos);
                console.log(mvt_pp);
            }

            let positions_piece = [];
            for (let m of mvt_pp) {
                let pos = m.getAllPositions(this.board);
                //console.log(pos);
                for (let mpos of pos) positions_piece.push(mpos);
            }

            player.setPossibleMove(p_player, positions_piece);
            if(affichage) {
                console.log(positions_piece);
                console.log(" ===================================== ");
            }
        }
        if(affichage) {
            console.log(pieces_player);
            console.log("=======================================");
        }
    }

    transformAPiece(piece, pos) {
        this.gameStopped = true;
        let obj = this;

        this.board.onChangePieceShape(this.currentPlayer, (val, pieceClick) => {
            console.log("    ONCLICK ON GAME !");
            let id = val;

            let newP = undefined;
            switch (id) {
                case  TransformPieces.TOWER :
                    newP = Tower.CreateWithCloningAndAppearance(
                        true,
                        piece,
                        pieceClick.appearance
                    );
                    break;
                case TransformPieces.QUEEN :
                    newP = Queen.CreateWithCloningAndAppearance(
                            true,
                            piece,
                            pieceClick.appearance
                    );
                    break;
                case TransformPieces.KNIGHT :
                    newP = Knight.CreateWithCloningAndAppearance(
                            true,
                            piece,
                            pieceClick.appearance
                    );
                    break;
                case TransformPieces.BISHOP :
                    newP = Bishop.CreateWithCloningAndAppearance(
                            true,
                            piece,
                            pieceClick.appearance
                    );
                    break;
            }
            obj.board.setAPieces(pos.x, pos.y, newP);

            //player piece destruction
            piece.possessor.destroyAPiece(piece);
            //Maj last shot Piece Transformation
            obj.allShots.peek()[0].IDTransformedPiece = id;

            obj.gameStopped = false;
            obj.board.UI.transformScreen.style.cssText = "display : none !important";

            obj.board.commitChanges();

            //Now we can go to another turn
            //Start a new turn
            if (obj.startANewTurn()) {
                //If its finished, then stop the treatment
                obj.onEndingGame();
            }

            console.log("    END ONCLICK ON GAME !");
        });
    }

    /**
     * ======== For game rock mechanics ========
     **/
    computeRockInGame(player) {
        //CLEAR first
        this.rockPiecePositons = new Map();
        //Next need to check if p is not menaced
        if (!this.isMenaced(player)) {
            //We need to get all the pieces in case for the rock
            for (let p_player of player.getPiecesToRock()) {
                //If this piece hasn't moved yet and still alive
                if (!p_player.movedYet && player.isAlive(p_player)) {
                    let pos_p = this.board.getPiecePosition(p_player);
                    let list_assoc = player.getAssoToRockWithPiece(p_player);
                    for (let as of list_assoc) {
                        let to_rock_with = as.pieceToRockWith;

                        //If the other piece hasn't moved yet and still alive
                        if (!to_rock_with.movedYet && player.isAlive(to_rock_with)) {
                            let pos_p_to_rock = as.posPieceToRockWith;

                            //Now we check if there is no pieces between theme
                            if (this.board.noPiecesBetween(pos_p, pos_p_to_rock)) {
                                //We can perform the rock, so we mention it
                                //We finally need to check if this movement performed make us menaced
                                this.moveAPiece_rock(pos_p, as);

                                for (let gamePlayer of this.players) {
                                    this.computePossibleMvts(gamePlayer);
                                }

                                //Now check if there is still a chess state
                                if (!this.isMenaced(player)) {
                                    let positions = this.rockPiecePositons.get(p_player);
                                    if (positions !== undefined) {
                                        positions.push(as);
                                    } else {
                                        this.rockPiecePositons.set(p_player, [as]);
                                    }
                                }
                                let ls = this.cancelAShot();
                            }
                        }
                    }
                }
            }
        }
    }

    moveAPiece_rock(start, as) {
        //Move a piece form start position to end position by rock
        let p1_case_start = this.board.getACase(start.x, start.y);
        let l = [];
        let piece1 = p1_case_start.piece;

        l.push(new Shot(piece1, start, as.p1, undefined, false, true));
        l.push(new Shot(as.pieceToRockWith, as.posPieceToRockWith, as.p2, undefined, false, true));
        this.allShots.push(l);

        this.board.setAPieces(start.x, start.y, undefined);
        this.board.setAPieces(as.p1.x, as.p1.y, piece1);
        piece1.movedYet = true;
        this.board.setAPieces(as.posPieceToRockWith.x, as.posPieceToRockWith.y, undefined);
        this.board.setAPieces(as.p2.x, as.p2.y, as.pieceToRockWith);
        as.pieceToRockWith.movedYet = true;
    }

    moveAPiece_animated_rock(start, as) {
        //Move a piece form start position to end position with animation

        //Stop the onclk
        this.gameStopped = true;

        let p1_case_start = this.board.getACase(start.x, start.y);
        let p2_case_start = this.board.getACase(as.posPieceToRockWith.x, as.posPieceToRockWith.y);

        let p1_case_end = this.board.getACase(as.p1.x, as.p1.y);
        let p2_case_end = this.board.getACase(as.p2.x, as.p2.y);

        let l = [];
        l.push(new Shot(p1_case_start.piece, start, as.p1, undefined, true, true));
        l.push(new Shot(as.pieceToRockWith, as.posPieceToRockWith, as.p2, undefined, true, true));
        this.allShots.push(l);

        let p2 = p2_case_start.piece;
        let p1 = p1_case_start.piece;

        let animator = new AnimatorBoard(animation_duration, this.board);
        let obj = this;
        animator.onStart = new function () {
            this.board.setAPieces(p1_case_start.col, p1_case_start.row, undefined);
            this.board.setAPieces(p2_case_start.col, p2_case_start.row, undefined);
        }

        animator.onEnd = new function () {
            //Visual animation ending
            obj.board.restart_no_animation_context();

            //Perform the complete both movement
            obj.board.setAPieces(p1_case_end.col, p1_case_end.row, p1);
            p1.movedYet = true;
            obj.board.setAPieces(p2_case_end.col, p2_case_end.row, p2);
            p2.movedYet = true;

            //Cancel pause moment
            obj.gameStopped = false;

            //Go through another round
            //Start a new turn
            if (obj.startANewTurn()) {
                //If its finished, then stop the treatment
                obj.board.commitChanges();
                obj.onEndingGame();
            }
            obj.board.commitChanges();
        }

        //Animation function to call for perform a smooth displacement of the piece and not a teleportation
        this.board.animatedDisplacement([p1_case_start, p2_case_start], [p1_case_end, p2_case_end], 2, animator);
    }


    /**
     * ======== For layout MAJ (UI) ========
     **/
    //Add piece to cimatary player p layout
    addCimetaryLayout(player, piece) {
        let ind = this.getIndex(player);
        if (ind >= 0) {
            let cimetary_size = this.players[ind].cimetary.length -1;
            let container_to_change = (cimetary_size>8)? this.players[ind].UI.cimetary_2 : this.players[ind].UI.cimetary_1;

            //console.log("PUSH : ELEM TO WATCH");
            //console.log(this.players[ind].cimetary);
            //console.log(cimetary_size);
            //console.log(container_to_change);
            //console.log(container_to_change.children[cimetary_size%8]);
            //console.log(container_to_change.children[cimetary_size%8].firstChild);

            let elTOadd = (piece.lastShape)? piece.lastShape.appearance.image : piece.appearance.image;
            if(container_to_change.children[cimetary_size%8].firstChild === null){
                container_to_change.children[cimetary_size%8].appendChild(elTOadd);
            }else{
                container_to_change.children[cimetary_size % 8].firstChild.src = elTOadd.src;
            }
        }
    }

    //Remove last elem from cimatary player p layout
    popCimetaryLayout(player) {
        console.log("POP : ELEM TO WATCH");
        console.log(player);

        let ind = this.getIndex(player);
        if (ind >= 0) {
            let cimetary_size = this.players[ind].cimetary.length -1;
            if(cimetary_size>0) {
                let container_to_change = (cimetary_size > 8) ? this.players[ind].UI.cimetary_2 : this.players[ind].UI.cimetary_1;

                console.log(this.players[ind].cimetary);
                console.log(cimetary_size);
                console.log(container_to_change);
                console.log(container_to_change.children[cimetary_size % 8]);

                container_to_change.children[cimetary_size % 8].firstChild.src = "";
            }
        }
    }

    constructPlayerLayout(elem) {
        for (let p of this.players) {
            p.UI_draw(elem);
        }
    }

    resetLayoutColors(){
        for (let p of this.players){
            p.UI.playerCard.classList.remove("activePlayer");
        }
    }

    majLayoutPlayerTurn(player) {
        this.resetLayoutColors();
        player.UI.playerCard.classList.add("activePlayer");
    }
}