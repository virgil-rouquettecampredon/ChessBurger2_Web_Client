/* ==================================================================================
    ACTIONS BEHAVIORS FOR A MOVEMENT
    => An action is related to a movement and describe a condition for being valid
================================================================================== */

const ActionState = {
    VALID       : 1,
    INVALID     : 2,
    STILLGOOD   : 3
}

class ActionDeplacement {
    constructor() {}

    isValidated(caseToCheck) {
        if (caseToCheck === undefined) return ActionState.INVALID;
        if (caseToCheck.piece === undefined) {
            return ActionState.STILLGOOD;
        }
        return ActionState.INVALID;
    }
}

class ActionEat{
    constructor(piece) {
        this.piece = piece;
    }

    isValidated(caseToCheck) {
        if(caseToCheck === undefined) return ActionState.INVALID;
        let p = this.piece.possessor;
        if(caseToCheck.piece !== undefined){
            if(!p.isAlly(caseToCheck.piece.possessor)){
                //We can eat
                //We add new TastyPieces on the current action eat pieces
                this.piece.tastyPieces.push(caseToCheck.piece);
                return ActionState.VALID;
            }else{
                //We cant eat an ally
                return ActionState.INVALID;
            }
        }else{
            //We dont know if the piece can eat because case is empty
            //But for vectorial displacement, its important to continu the traitement
            //And not stop at the first empty case because we cant eat here
            return ActionState.STILLGOOD;
        }
    }
}

