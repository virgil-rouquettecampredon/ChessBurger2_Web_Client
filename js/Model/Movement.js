/* ==================================================================================
    MOVEMENT BEHAVIORS
    => A movement is a data structure that describe a displaccement on a 2D board
================================================================================== */

class Position {

    constructor(x, y) {
        this.x = x ?? 0;
        this.y = y ?? 0;
    }

    addAndReturn(position) {
        return new Position(this.x + position.x, this.y + position.y);
    }

    add(position) {
        this.x += position.x;
        this.y += position.y;
    }

    difference(position) {
        return new Position(this.x - position.x, this.y - position.y);
    }
}

class Movement{

    constructor(action, posStart, incrementation) {
        if(this.constructor === Movement){
            throw new Error("FYI: Instance of Abstract class cannot be instantiated (Movement)");
        }else {
            this.action = action;
            this.posStart = posStart;
            this.incrementation = incrementation;
        }
    }
}

class MovementPiece extends Movement {

    constructor(action, posStart, incrementation, cpt_mvt_performed, canStillMove) {
        super(action, posStart, incrementation);
        this.cpt_mvt_performed = cpt_mvt_performed ?? -1;
        this.canStillMove = canStillMove ?? true;
    }

    static createMovementUnique(action, posStart, incrementation, cpt_mvt_performed, canStillMove) {
        return new MovementPiece(action, posStart, incrementation, cpt_mvt_performed, canStillMove);
    }

    static createMovementVector(action, posStart, incrementation) {
        return new MovementPiece(action, posStart, incrementation, -1, true);
    }

    getAllPositions(board) {
        //console.log("GET ALL POSITIONS");
        let res = [];

        let cpt_dep = this.cpt_mvt_performed;
        let positionP = new Position(this.posStart.x,this.posStart.y);

        //console.log(positionP);
        //console.log(board.isGoodPos(positionP.x, positionP.y));
        //console.log(cpt_dep != 0);


        while (board.isGoodPos(positionP.x, positionP.y) && (cpt_dep != 0)) {

            positionP = positionP.addAndReturn(this.incrementation);
            let ac = this.action.isValidated(board.getACase(positionP.x, positionP.y));

            //console.log(" ====== WHILE START ====== ");
            //console.log(positionP);
            //console.log(this.canStillMove);
            //board.isGoodPos(positionP.x, positionP.y)
            //console.log(ac);

            if (ActionState.VALID == ac || (this.canStillMove && ac == ActionState.STILLGOOD)) {
                res.push(positionP);
                if (ActionState.VALID == ac) {
                    break;
                }
            } else {
                break;
            }
            cpt_dep--;
        }

        //console.log(" ====== MOVEMENT END ====== ");
        //console.log(res);
        return res;
    }
}