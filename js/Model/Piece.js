/* ==================================================================================
    PIECE BEHAVIORS
================================================================================== */

const Direction = {
    UP : 0,
    DOWN : 1,
    LEFT : 2,
    RIGTH : 3,
}


class Piece {

    constructor(player) {
        if(this.constructor === Movement){
            throw new Error("FYI: Instance of Abstract class cannot be instantiated (PIECE)");
        }else {
            this.movedYet = false;
            this.possessor = player;
            this.appearance = new ComposedDrawing();
            this.tastyPieces = [];

            this.lastShape = undefined;
            this.deapCloneOnGame = false;
        }
    }

    CreateWithCloning(deapClonedOnGame, pieceToClone){
        this.movedYet        = pieceToClone.movedYet;
        this.appearance      = new ComposedDrawing();
        this.tastyPieces     = [];
        this.possessor       = pieceToClone.possessor;

        this.lastShape       = pieceToClone;
        this.deapCloneOnGame = deapClonedOnGame;

        //This case is commonly used to create another piece based on a precedent one
        //The transform mechanism for example
        if(deapClonedOnGame){
            //this take the place of p for the player
            pieceToClone.possessor.destroyAPiece(pieceToClone);
            pieceToClone.possessor.addPiece(this);
        }
    }

    static CreateWithCloningAndAppearance(deapClonedOnGame, pieceToClone, appearance){
        let res = new this;
        res.CreateWithCloning(deapClonedOnGame,pieceToClone);
        res.appearance = appearance;
        return res;
    }
    
    /**
     * Get all the possible movement that a piece can perform
     *
     * @param col : Number of column since the piece start to compute mvt
     * @param row : Number of row since the piece start to compute mvt
     * @return list of movements that the piece can achieve
     **/
    getAllPossibleMvt(col, row){}


    /**
     * Get if the piece is a victory condition piece
     **/
    isVictoryCondition() {
        return false;
    }

    /**
     * Say if a piece can be transformed or not
     **/
    canBeTransformed() {
        return false;
    }

    /**
     * Clear all the pieces that this can eat currently
     **/
    clearTastyPieces() {
        this.tastyPieces = [];
    }

    /**
     * Get back to the precedent shape for a piece
     **/
    getBackPrecedentShape() {
        if (this.lastShape !== undefined) {
            //This case is commonly used to create another piece based on a precedent one
            //The transform mechanism for example
            if (this.deapCloneOnGame) {
                //this take the place of p for the player
                this.possessor.destroyAPiece(this);
                this.possessor.addPiece(this.lastShape);
            }

            //Then we transform this to its last shape
            this.movedYet = this.lastShape.movedYet;
            this.possessor = this.lastShape.possessor;
            this.appearance = this.lastShape.appearance;
            this.tastyPieces = [];

            this.lastShape = this.lastShape.lastShape;
            this.deapCloneOnGame = this.lastShape.deapCloneOnGame;
        }
    }
}

/*============= CHESS PIECES =============*/
class  Bishop extends Piece{
    constructor(player, color_fill, color_plate,color_stroke, color_elements) {
        super(player);
        this.appearance.addLayer(getDrawableSRC("pieces_bishop.svg"), color_fill,color_stroke);
        this.appearance.addLayer(getDrawableSRC("pieces_bishop_plate.svg"), color_plate,color_stroke);
        this.appearance.addLayer(getDrawableSRC("pieces_bishop_element.svg"), color_stroke,color_stroke);
        this.appearance.addLayer(getDrawableSRC("pieces_bishop_element_bis.svg"), color_elements,color_elements);
    }

    getAllPossibleMvt(col, row) {
        let mvt = [];
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(1, 1)));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(-1, -1)));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(1, -1)));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(-1, 1)));
        return mvt;
    }
}

class King extends Piece {
    constructor(player, color_fill, color_plate, color_stroke, color_elements) {
        super(player);
        this.appearance.addLayer(getDrawableSRC("pieces_king.svg"), color_fill, color_stroke);
        this.appearance.addLayer(getDrawableSRC("pieces_king_plate.svg"), color_plate, color_stroke);
        this.appearance.addLayer(getDrawableSRC("pieces_king_element.svg"), color_elements, color_stroke);
    }

    getAllPossibleMvt(col, row) {
        let mvt = [];
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(0, 1), 1, true));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(1, 1), 1, true));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(1, 0), 1, true));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(1, -1), 1, true));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(0, -1), 1, true));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(-1, -1), 1, true));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(-1, 0), 1, true));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(-1, 1), 1, true));
        return mvt;
    }

    isVictoryCondition() {
        return true;
    }
}

class Knight extends Piece{
    constructor(player, color_fill, color_plate, color_stroke) {
        super(player);
        this.appearance.addLayer(getDrawableSRC("pieces_knight.svg"), color_fill,color_stroke);
        this.appearance.addLayer(getDrawableSRC("pieces_knight_plate.svg"), color_plate,color_stroke);
    }

    getAllPossibleMvt( col,  row) {
        let mvt = [];
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(2, 1), 1, true));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(2, -1), 1, true));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(-2, 1), 1, true));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(-2, -1), 1, true));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(1, 2), 1, true));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(-1, -2), 1, true));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(1, -2), 1, true));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(-1, 2), 1, true));
        return mvt;
    }
}

class Pawn extends Piece {

    constructor(player, color_fill,color_plate, color_stroke, direction) {
        super(player);
        this.appearance.addLayer(getDrawableSRC("pieces_pawn.svg"), color_fill, color_stroke);
        this.appearance.addLayer(getDrawableSRC("pieces_pawn_plate.svg"), color_plate, color_stroke);
        this.direction = direction;
    }

    static CreateWithCloningAndAppearance(deapCloneOnGame, pieceToClone, appearance, direction) {
        let res = Piece.CreateWithCloningAndAppearance(deapCloneOnGame, pieceToClone, appearance);

        res.appearance = appearance;
        res.direction = direction;
        return res;
    }

    getAllPossibleMvt(col, row) {
        let mvt = [];
        let start = new Position(col, row);
        let pos_eat = [];

        let addx = 0;
        let addy = 0;

        switch (this.direction) {
            case Direction.UP:
                addy--;
                pos_eat.push(new Position(-1, -1));
                pos_eat.push(new Position(+1, -1));
                break;
            case Direction.DOWN:
                addy++;
                pos_eat.push(new Position(-1, +1));
                pos_eat.push(new Position(+1, +1));
                break;
            case Direction.LEFT:
                addx--;
                pos_eat.push(new Position(-1, +1));
                pos_eat.push(new Position(-1, -1));
                break;
            case Direction.RIGHT:
                addx++;
                pos_eat.push(new Position(+1, +1));
                pos_eat.push(new Position(+1, -1));
                break;
        }

        mvt.push(new MovementPiece(new ActionDeplacement(), start, new Position(addx, addy), ((this.movedYet) ? 1 : 2), true));
        pos_eat.forEach(elem => mvt.push(new MovementPiece(new ActionEat(this), start, elem, 1, false)));
        return mvt;
    }

    canBeTransformed() {
        return true;
    }
}

class Queen extends Piece {
    constructor(player, color_fill, color_plate, color_stroke) {
        super(player);
        this.appearance.addLayer(getDrawableSRC("pieces_queen.svg"), color_fill, color_stroke);
        this.appearance.addLayer(getDrawableSRC("pieces_queen_plate.svg"), color_plate, color_stroke);
    }

    getAllPossibleMvt(col, row) {
        let mvt = [];
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(0, 1)));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(0, -1)));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(1, 0)));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(-1, 0)));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(1, 1)));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(-1, -1)));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(1, -1)));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(-1, 1)));
        return mvt;
    }

}

class Tower extends Piece {
    constructor(player, color_fill,color_plate, color_stroke) {
        super(player);
        this.appearance.addLayer(getDrawableSRC("pieces_tower.svg"), color_fill, color_stroke);
        this.appearance.addLayer(getDrawableSRC("pieces_tower_plate.svg"), color_plate, color_stroke);
    }

    getAllPossibleMvt(col, row) {
        let mvt = [];
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(0, 1)));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(0, -1)));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(1, 0)));
        mvt.push(new MovementPiece(new ActionEat(this), new Position(col, row), new Position(-1, 0)));
        return mvt;
    }
}