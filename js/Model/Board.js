/* ==================================================================================
    BOARD BEHAVIORS
================================================================================== */

//All Appearances for special drawing on cases
let color_possiblepos       = colorPrimaryVariant;
let color_possiblepos_eat   = colorTertiaryVariant;
let color_confirmation      = colorPrimaryVariantDark;
let color_menaced           = colorTertiary;
let color_rock              = "#A6F1A6";

let color_case_white        = colorSecondary;
let color_case_black        = colorSecondaryVariant;

let main_color_piece                = ["#FFFFFF", "#000000"];
let border_color_piece              = ["#000000", "#000000"];
let color_piece_second              = ["#000000", "#FFFFFF"];
let plate_color_piece               = ["#FFFFFF","#FFFFFF"];


const TransformPieces = {
    TOWER : 1,
    QUEEN : 2,
    BISHOP : 3,
    KNIGHT : 4,
}

function createGameCSS() {
    return "#boardWrapper{\n" +
        "    width  : 100%;\n" +
        "    height : 100%;\n" +
        "}\n" +
        "\n" +
        "#boardWrapper #canvasWrapper {\n" +
        "    width  : 100%;\n" +
        "    height : 100%;\n" +
        "    position: relative;\n" +
        "}\n" +
        "\n" +
        "#boardWrapper #canvasWrapper #transform_screen {\n" +
        "    top     : 0;\n" +
        "    left    : 12px;\n" +
        "    background-color: rgba(0,0,0,0.5);\n" +
        "    border  : solid 2px black;\n" +
        "    width   : calc(100% - 24px);\n" +
        "    height  : 100%;\n" +
        "    z-index: 1;\n" +
        "    position: absolute;\n" +
        "}\n" +
        "\n" +
        "#boardWrapper #canvasWrapper #end_screen {\n" +
        "    top: 0;\n" +
        "    left: 12px;\n" +
        "    background-color: rgba(0,0,0,0.5);\n" +
        "    border: solid 2px black;\n" +
        "    width  : calc(100% - 12px);\n" +
        "    height : 100%;\n" +
        "    z-index: 1;\n" +
        "    position: absolute;\n" +
        "}";
}

class Case {
    constructor(bounds, color, col,row) {
        this.bounds = bounds;

        this.piece                      = undefined;
        this.rock_elem                  = undefined;
        this.possible_pos               = false;
        this.pre_selected_pos           = false;

        this.is_end_case                = false;
        this.is_case_with_menace_on_it  = false;

        this.color = color;
        this.col = col;
        this.row = row;

        //cpt for drawing count
        this.nb_draw = 0;

        this.isPieceMoving = false;
        this.pieceToMove = undefined;
    }

    drawCaseGradient(context, color) {
        //let radius = Math.min(this.bounds.right,this.bounds.bottom);
        let border = 2;
        let space = .5;

        context.save();

        //console.log("DRAWCASE GRAD : " + radius);
        //radius/=2;

        //let x = this.bounds.left+(this.bounds.right/2);
        //let y = this.bounds.top+(this.bounds.bottom/2);

        //let grd = context.createRadialGradient(x, y, radius, x, y, 7*radius/8);
        //grd.addColorStop(0, color);
        //grd.addColorStop(1, "#FFFFFF00");
        //context.fillStyle = grd;
        //context.fillRect(this.bounds.left, this.bounds.top, this.bounds.right, this.bounds.bottom);

        context.strokeStyle = color;
        context.lineWidth   = border;
        context.strokeRect(this.bounds.left+border/2 + space, this.bounds.top+border/2+space, this.bounds.right-border-space, this.bounds.bottom-border-space);
        context.restore();
    }

    onDraw(context) {
        //Clear the case first
        context.clearRect(this.bounds.left, this.bounds.top, this.bounds.right, this.bounds.bottom);
        //then draw background
        context.beginPath();
        context.rect(this.bounds.left, this.bounds.top, this.bounds.right, this.bounds.bottom);
        context.fillStyle = this.color;
        context.fill();

        //Try first to draw the possibly pre_selected information that a case can contain
        if (this.pre_selected_pos) {
            this.drawCaseGradient(context, color_confirmation);
        } else {
            //Draw possible pos filter
            if (this.possible_pos) {
                //Try first to draw if a case with possible position contain a case
                if (this.piece != undefined) {
                    this.drawCaseGradient(context, color_possiblepos_eat);
                } else {
                    //Then try to see if a case is a possible movement and contain a rock structure
                    if (this.rock_elem != undefined) {
                        this.drawCaseGradient(context, color_rock);
                    } else {
                        this.drawCaseGradient(context, color_possiblepos);
                    }
                }
            } else {
                //Next try to draw the possible menace that a case can possibly contain
                if (this.is_case_with_menace_on_it) {
                    this.drawCaseGradient(context, color_menaced);
                }
            }
        }

        //Draw piece
        if (this.piece != undefined) {
            let appearance = this.piece.appearance;
            appearance.setBounds(this.bounds.left, this.bounds.top, this.bounds.right, this.bounds.bottom);
            appearance.draw(context);
        }
        this.nb_draw++;
    }

    clearCase() {
        this.piece              = undefined;
        this.possible_pos       = false;
        this.pre_selected_pos   = false;
    }
}

class Board {
//class Board extends HTMLElement {
    constructor() {
        //super();

        this.UI = {};
        this.getInformationUI();
        this.constructUI();
        this.constructUIScreens();

        this.cases = new Array(this.nb_col * this.nb_row);
        this.initBoard();

        console.log("BOARD CREATION !");
        console.log(this);
        console.log(this.cases);

        this.changedCases = [];
    }

    getInformationUI() {
        this.nb_col = /*this.getAttribute("col") ||*/ 8;
        this.nb_row = /*this.getAttribute("row") ||*/ 8;
    }

    constructUI() {
        // ========= Ghost root
        //this.UI.shadowRoot = this.attachShadow({mode: "open"});
        this.UI.shadowRoot = document.getElementById("game");

        let root = document.createElement("div");
        root.setAttribute("id", "root_board");
        root.setAttribute("class", "container");

        this.UI.boardWrapper = document.createElement("div");
        this.UI.boardWrapper.setAttribute("id", "boardWrapper");
        this.UI.boardWrapper.setAttribute("class", "row");

        // ========= Row informations
        this.UI.row_infos = document.createElement("div");
        this.UI.row_infos.setAttribute("class", "row row_infos");
        this.UI.row_infos.style.color = "white";
        this.UI.row_infos.style.fontFamily = "'Permanent Marker', cursive";

        let div_offset = document.createElement("div");
        div_offset.setAttribute("class", "col-2 col-sm-1");
        this.UI.row_infos.appendChild(div_offset);
        for (let i = 0; i < 8; i++) {
            let div = document.createElement("div");
            div.setAttribute("class","col");
            div.innerText = "" + i;
            div.style.textAlign = "center";
            div.style.fontSize = "1.1vw";
            this.UI.row_infos.appendChild(div);
        }

        // ========= Col informations
        this.UI.col_infos = document.createElement("div");
        this.UI.col_infos.setAttribute("class", "col_infos col-2 col-sm-1 d-flex flex-column");
        this.UI.col_infos.style.color = "white";
        this.UI.col_infos.style.fontFamily = "'Permanent Marker', cursive";
        let val = ["A","B","C","D","E","F","G","H"];
        for (let i = 0; i < 8; i++) {
            let div = document.createElement("div");
            div.setAttribute("class","p-2 text-center");
            div.innerText = val[i];
            div.style.display = "flex";
            div.style.flex = "1";
            div.style.justifyContent = "center";
            div.style.fontSize = "1.1vw";
            div.style.alignItems = "center";
            this.UI.col_infos.appendChild(div);
        }

        // ========= Board informations
        let wrapperWrapperCanvas = document.createElement("div");
        wrapperWrapperCanvas.setAttribute("class", "col-10 col-sm-11");
        wrapperWrapperCanvas.style.padding = "0px !important";

        this.UI.canvasWrapper = document.createElement("div");
        this.UI.canvasWrapper.setAttribute("id", "canvasWrapper");
        this.UI.canvasWrapper.setAttribute("class", "row ratio ratio-1x1");

        this.UI.canvas = document.createElement("canvas");
        this.UI.canvas.setAttribute("id", "gameBoardCanvas");

        this.UI.canvasWrapper.appendChild(this.UI.canvas);

        this.UI.boardWrapper.appendChild(this.UI.col_infos);
        wrapperWrapperCanvas.appendChild(this.UI.canvasWrapper);
        this.UI.boardWrapper.appendChild(wrapperWrapperCanvas);
        this.UI.boardWrapper.appendChild(this.UI.row_infos);

        //let gameStyle = document.createElement("style");
        //gameStyle.textContent = createGameCSS();
        //this.UI.shadowRoot.appendChild(gameStyle);

        root.appendChild(this.UI.boardWrapper);
        this.UI.shadowRoot.appendChild(root);

        this.contextboard = this.UI.canvas.getContext('2d');
        this.contextboard.imageSmoothingEnabled = false;
    }

    constructUIScreens() {
        // ========= End screen UI
        this.UI.endScreen = document.createElement("div");
        this.UI.endScreen.setAttribute("id", "end_screen");
        this.UI.endScreen.setAttribute("class", "cover-container d-flex h-100 p-3 mx-auto flex-column text-center");

        let finish_header = document.createElement("header");
        finish_header.setAttribute("class","masthead mb-auto");
        let finish_h_div = document.createElement("div");
        finish_h_div.setAttribute("class","inner");

        this.UI.endScreen_startmessage = document.createElement("h3");
        this.UI.endScreen_startmessage.setAttribute("class","start masthead-brand player");
        finish_h_div.appendChild(this.UI.endScreen_startmessage);
        finish_header.appendChild(finish_h_div);
        this.UI.endScreen.appendChild(finish_header);



        let finish_main = document.createElement("main");
        finish_main.setAttribute("class", "inner cover");
        finish_main.setAttribute("role", "main");

        this.UI.endScreen_midmessage = document.createElement("h3");
        this.UI.endScreen_midmessage.setAttribute("class", "mid cover-heading");
        finish_main.appendChild(this.UI.endScreen_midmessage);
        this.UI.endScreen.appendChild(finish_main);


        let finish_footer = document.createElement("footer");
        finish_footer.setAttribute("class","mastfoot mt-auto");
        let finish_d_footer = document.createElement("div");
        finish_d_footer.setAttribute("class","inner");

        this.UI.endScreen_endmessage = document.createElement("h3");
        this.UI.endScreen_endmessage.setAttribute("class", "end cover-heading");
        finish_d_footer.appendChild(this.UI.endScreen_endmessage);
        finish_footer.appendChild(finish_d_footer);
        this.UI.endScreen.appendChild(finish_footer);


        //this.UI.endScreen.style.display = "none !important";
        this.UI.endScreen.style.cssText = "display : none !important";
        //this.UI.endScreen.style.cssText = "display : flex !important";



        // ========= Transform screen UI
        this.UI.transformScreen = document.createElement("div");
        this.UI.transformScreen.setAttribute("id", "transform_screen");
        this.UI.transformScreen.setAttribute("class", "cover-container d-flex h-100 p-3 mx-auto flex-column text-center");


        let header = document.createElement("header");
        header.setAttribute("class","masthead mb-auto");
        let h_div = document.createElement("div");
        h_div.setAttribute("class","inner");

        this.UI.transformScreen_player = document.createElement("h3");
        this.UI.transformScreen_player.setAttribute("class","masthead-brand player");
        h_div.appendChild(this.UI.transformScreen_player);
        header.appendChild(h_div);
        this.UI.transformScreen.appendChild(header);

        let main = document.createElement("main");
        main.setAttribute("class", "inner cover");
        main.setAttribute("role", "main");

        this.UI.transformScreen_message = document.createElement("h3");
        this.UI.transformScreen_message.setAttribute("class", "message cover-heading");
        this.UI.transformScreen_message.innerText = "Veuillez choisir une pièce à transformer";

        this.UI.transformScreen_imgWrapper = document.createElement("div");
        this.UI.transformScreen_imgWrapper.setAttribute("class", "images lead row");

        this.UI.transformScreen_piece_tower = document.createElement("img");
        this.UI.transformScreen_piece_bishop = document.createElement("img");
        this.UI.transformScreen_piece_queen = document.createElement("img");
        this.UI.transformScreen_piece_knight = document.createElement("img");

        this.UI.transformScreen_piece_tower.setAttribute("class", "col ratio ratio-1x1");
        this.UI.transformScreen_piece_bishop.setAttribute("class", "col ratio ratio-1x1");
        this.UI.transformScreen_piece_queen.setAttribute("class", "col ratio ratio-1x1");
        this.UI.transformScreen_piece_knight.setAttribute("class", "col ratio ratio-1x1");

        this.UI.transformScreen_piece_tower.alt = "img";
        this.UI.transformScreen_piece_bishop.alt = "img";
        this.UI.transformScreen_piece_queen.alt = "img";
        this.UI.transformScreen_piece_knight.alt = "img";

        this.UI.transformScreen_imgWrapper.appendChild(this.UI.transformScreen_piece_tower);
        this.UI.transformScreen_imgWrapper.appendChild(this.UI.transformScreen_piece_bishop);
        this.UI.transformScreen_imgWrapper.appendChild(this.UI.transformScreen_piece_queen);
        this.UI.transformScreen_imgWrapper.appendChild(this.UI.transformScreen_piece_knight);

        main.appendChild(this.UI.transformScreen_message);
        main.appendChild(this.UI.transformScreen_imgWrapper);
        this.UI.transformScreen.appendChild(main);

        let footer = document.createElement("footer");
        footer.setAttribute("class","mastfoot mt-auto");
        let d_footer = document.createElement("div");
        d_footer.setAttribute("class","inner");
        d_footer.innerText = "(click to chose)";

        footer.appendChild(d_footer);
        this.UI.transformScreen.appendChild(footer);

        //this.UI.transformScreen.style.display = "none !important";
        this.UI.transformScreen.style.cssText = "display : none !important";

        this.UI.canvasWrapper.appendChild(this.UI.transformScreen);
        this.UI.canvasWrapper.appendChild(this.UI.endScreen);
    }

    createCase(col, row, isWhite) {
        let w = this.UI.canvas.width;
        let h = this.UI.canvas.height;

        //console.log("========== I CREATE A CASE ! ==========")
        //console.log("W : " + w);
        //console.log("H : " + h);

        let w_case = Math.floor(w/this.nb_col);
        let h_case = Math.floor(h/this.nb_row);

        let caseToReturn = new Case({
                left    :   Math.floor((col / this.nb_col) * w),
                right   :   w_case,
                top     :   Math.floor(((row) / this.nb_row) * h),
                bottom  :   h_case
            },
            ((isWhite) ? color_case_white : color_case_black),
            col,
            row
        );

        caseToReturn.is_end_case = (row === 0 || row === (this.nb_row - 1));
        //caseToReturn.is_end_case = (row === 2 || row === (this.nb_row - 1));
        return caseToReturn;
    }

    initBoard() {
        //Create all the cases in our model
        let white;
        let start_white = true;

        for (let i = 0; i < this.nb_row; i++) {
            white = start_white;
            for (let j = 0; j < this.nb_col; j++) {
                this.cases[i * this.nb_col + j] = this.createCase(j, i, white);
                white = !white;
            }
            start_white = !start_white;
        }
    }

    //Init the game (players and pieces), need to be called by the manager
    initGameInstances() {
        let players = [];
        players.push(new Player("WHITE", main_color_piece[0]));
        players.push(new Player("BLACK", main_color_piece[1]));
        players[0].playerIndex = 0;
        players[1].playerIndex = 1;

        let p1_pawn1 = new Pawn(players[0], main_color_piece[0], plate_color_piece[0], border_color_piece[0], Direction.UP);
        let p1_pawn2 = new Pawn(players[0], main_color_piece[0], plate_color_piece[0], border_color_piece[0], Direction.UP);
        let p1_pawn3 = new Pawn(players[0], main_color_piece[0], plate_color_piece[0], border_color_piece[0], Direction.UP);
        let p1_pawn4 = new Pawn(players[0], main_color_piece[0], plate_color_piece[0], border_color_piece[0], Direction.UP);
        let p1_pawn5 = new Pawn(players[0], main_color_piece[0], plate_color_piece[0], border_color_piece[0], Direction.UP);
        let p1_pawn6 = new Pawn(players[0], main_color_piece[0], plate_color_piece[0], border_color_piece[0], Direction.UP);
        let p1_pawn7 = new Pawn(players[0], main_color_piece[0], plate_color_piece[0], border_color_piece[0], Direction.UP);
        let p1_pawn8 = new Pawn(players[0], main_color_piece[0], plate_color_piece[0], border_color_piece[0], Direction.UP);
        let p1_tower1 = new Tower(players[0], main_color_piece[0], plate_color_piece[0], border_color_piece[0]);
        let p1_knight1 = new Knight(players[0], main_color_piece[0], plate_color_piece[0], border_color_piece[0]);
        let p1_bishop1 = new Bishop(players[0], main_color_piece[0], plate_color_piece[0], border_color_piece[0], color_piece_second[0]);
        let p1_king = new King(players[0], main_color_piece[0], plate_color_piece[0], border_color_piece[0], color_piece_second[0]);
        let p1_queen = new Queen(players[0], main_color_piece[0], plate_color_piece[0], border_color_piece[0]);
        let p1_tower2 = new Tower(players[0], main_color_piece[0], plate_color_piece[0], border_color_piece[0]);
        let p1_knight2 = new Knight(players[0], main_color_piece[0], plate_color_piece[0], border_color_piece[0]);
        let p1_bishop2 = new Bishop(players[0], main_color_piece[0], plate_color_piece[0], border_color_piece[0], color_piece_second[0]);

        players[0].addPiece(p1_pawn1);
        players[0].addPiece(p1_pawn2);
        players[0].addPiece(p1_pawn3);
        players[0].addPiece(p1_pawn4);
        players[0].addPiece(p1_pawn5);
        players[0].addPiece(p1_pawn6);
        players[0].addPiece(p1_pawn7);
        players[0].addPiece(p1_pawn8);
        players[0].addPiece(p1_tower1);
        players[0].addPiece(p1_knight1);
        players[0].addPiece(p1_bishop1);
        players[0].addPiece(p1_king);
        players[0].addPiece(p1_queen);
        players[0].addPiece(p1_tower2);
        players[0].addPiece(p1_knight2);
        players[0].addPiece(p1_bishop2);

        players[0].addRockPieces(p1_king, new Association_rock(p1_tower1, new Position(0, 7), new Position(1, 7), new Position(2, 7)));
        players[0].addRockPieces(p1_king, new Association_rock(p1_tower2, new Position(7, 7), new Position(6, 7), new Position(5, 7)));

        players[0].pieceTOTransformSrc.tower    = p1_tower1;
        players[0].pieceTOTransformSrc.queen    = p1_queen;
        players[0].pieceTOTransformSrc.bishop   = p1_bishop1;
        players[0].pieceTOTransformSrc.knight   = p1_knight1;

        let p2_pawn1 = new Pawn(players[1], main_color_piece[1], plate_color_piece[1], border_color_piece[1], Direction.DOWN);
        let p2_pawn2 = new Pawn(players[1], main_color_piece[1], plate_color_piece[1], border_color_piece[1], Direction.DOWN);
        let p2_pawn3 = new Pawn(players[1], main_color_piece[1], plate_color_piece[1], border_color_piece[1], Direction.DOWN);
        let p2_pawn4 = new Pawn(players[1], main_color_piece[1], plate_color_piece[1], border_color_piece[1], Direction.DOWN);
        let p2_pawn5 = new Pawn(players[1], main_color_piece[1], plate_color_piece[1], border_color_piece[1], Direction.DOWN);
        let p2_pawn6 = new Pawn(players[1], main_color_piece[1], plate_color_piece[1], border_color_piece[1], Direction.DOWN);
        let p2_pawn7 = new Pawn(players[1], main_color_piece[1], plate_color_piece[1], border_color_piece[1], Direction.DOWN);
        let p2_pawn8 = new Pawn(players[1], main_color_piece[1], plate_color_piece[1], border_color_piece[1], Direction.DOWN);
        let p2_tower1 = new Tower(players[1], main_color_piece[1], plate_color_piece[1], border_color_piece[1]);
        let p2_knight1 = new Knight(players[1], main_color_piece[1], plate_color_piece[1], border_color_piece[1]);
        let p2_bishop1 = new Bishop(players[1], main_color_piece[1], plate_color_piece[1], border_color_piece[1], color_piece_second[1]);
        let p2_king = new King(players[1], main_color_piece[1], plate_color_piece[1], border_color_piece[1], color_piece_second[1]);
        let p2_queen = new Queen(players[1], main_color_piece[1], plate_color_piece[1], border_color_piece[1]);
        let p2_tower2 = new Tower(players[1], main_color_piece[1], plate_color_piece[1], border_color_piece[1]);
        let p2_knight2 = new Knight(players[1], main_color_piece[1], plate_color_piece[1], border_color_piece[1]);
        let p2_bishop2 = new Bishop(players[1], main_color_piece[1], plate_color_piece[1], border_color_piece[1], color_piece_second[1]);

        players[1].addPiece(p2_pawn1);
        players[1].addPiece(p2_pawn2);
        players[1].addPiece(p2_pawn3);
        players[1].addPiece(p2_pawn4);
        players[1].addPiece(p2_pawn5);
        players[1].addPiece(p2_pawn6);
        players[1].addPiece(p2_pawn7);
        players[1].addPiece(p2_pawn8);
        players[1].addPiece(p2_tower1);
        players[1].addPiece(p2_knight1);
        players[1].addPiece(p2_bishop1);
        players[1].addPiece(p2_king);
        players[1].addPiece(p2_queen);
        players[1].addPiece(p2_tower2);
        players[1].addPiece(p2_knight2);
        players[1].addPiece(p2_bishop2);

        players[1].addRockPieces(p2_king, new Association_rock(p2_tower1, new Position(0, 0), new Position(1, 0), new Position(2, 0)));
        players[1].addRockPieces(p2_king, new Association_rock(p2_tower2, new Position(7, 0), new Position(6, 0), new Position(5, 0)));

        players[1].pieceTOTransformSrc.tower    = p2_tower1;
        players[1].pieceTOTransformSrc.queen    = p2_queen;
        players[1].pieceTOTransformSrc.bishop   = p2_bishop1;
        players[1].pieceTOTransformSrc.knight   = p2_knight1;

        //Put all the pieces in the board
        this.setAPieces(0, 1, p2_pawn1);
        this.setAPieces(1, 1, p2_pawn2);
        this.setAPieces(2, 1, p2_pawn3);
        this.setAPieces(3, 1, p2_pawn4);
        this.setAPieces(4, 1, p2_pawn5);
        this.setAPieces(5, 1, p2_pawn6);
        this.setAPieces(6, 1, p2_pawn7);
        this.setAPieces(7, 1, p2_pawn8);

        this.setAPieces(0, 0, p2_tower1);
        this.setAPieces(1, 0, p2_knight1);
        this.setAPieces(2, 0, p2_bishop1);
        this.setAPieces(3, 0, p2_queen);
        this.setAPieces(4, 0, p2_king);
        this.setAPieces(6, 0, p2_knight2);
        this.setAPieces(5, 0, p2_bishop2);
        this.setAPieces(7, 0, p2_tower2);

        this.setAPieces(0, 6, p1_pawn1);
        this.setAPieces(1, 6, p1_pawn2);
        this.setAPieces(2, 6, p1_pawn3);
        this.setAPieces(3, 6, p1_pawn4);
        this.setAPieces(4, 6, p1_pawn5);
        this.setAPieces(5, 6, p1_pawn6);
        this.setAPieces(6, 6, p1_pawn7);
        this.setAPieces(7, 6, p1_pawn8);

        this.setAPieces(0, 7, p1_tower1);
        this.setAPieces(1, 7, p1_knight1);
        this.setAPieces(2, 7, p1_bishop1);
        this.setAPieces(3, 7, p1_queen);
        this.setAPieces(4, 7, p1_king);
        this.setAPieces(6, 7, p1_knight2);
        this.setAPieces(5, 7, p1_bishop2);
        this.setAPieces(7, 7, p1_tower2);

        //Commit changes for displaying
        this.commitChanges();
        return players;
    }

    /** ======== Manip the Board Model ======== **/
    //Say if a position for a move on the board is correct or not
    isGoodPos(x, y) {
        return ((x >= 0 && x < this.nb_col) && (y >= 0 && y < this.nb_row));
    }

    //Get a Case element with the position on the board, null instead
    getACase(x, y) {
        if (this.isGoodPos(x, y)) return this.cases[y * this.nb_col + x];
        return undefined;
    }

    //Get a piece position on the board, P(-1,-1) instead
    getPiecePosition(piece) {
        let pos = new Position(-1, -1);
        for (let c of this.cases) {
            let pc = c.piece;
            if (pc != undefined && pc == piece) {
                pos = new Position(c.col, c.row);
                break;
            }
        }
        return pos;
    }



    //Set the end of the board
    onEndOfGame(start, players, end) {
        this.UI.endScreen_startmessage.innerText    = start;
        this.UI.endScreen_midmessage.innerText      = players;
        this.UI.endScreen_endmessage.innerText      = end;
        this.UI.endScreen.style.cssText = "display : flex !important";
    }

    //Set the UI for choice in game board changing
    onChangePieceShape(curP, fncOnclick) {
        //First set the screen to be "visible"
        //this.UI.transformScreen.style.display = "flex !important";
        this.UI.transformScreen.style.cssText = "display : flex !important";
        this.UI.transformScreen_player.innerText = curP.pseudo;

        //Next compute onclick for the game changing piece

        let obj = this;
        function onclick_listerner_knight(event) {
            console.log("ONCLICK KNIGHT !");
            if (event) {
                //obj.UI.transformScreen_piece_knight.removeEventListener('click', onclick_listerner_knight);
                obj.UI.transformScreen_piece_knight.onclick = function (){};
                fncOnclick(
                    TransformPieces.KNIGHT,
                    new Knight(
                        curP,
                        main_color_piece[curP.playerIndex],
                        plate_color_piece[curP.playerIndex],
                        border_color_piece[curP.playerIndex],
                    )
                );
            }
        }
        function onclick_listerner_tower(event) {
            console.log("ONCLICK TOWER !");
            if (event) {
                //obj.UI.transformScreen_piece_tower.removeEventListener('click', onclick_listerner_tower);
                obj.UI.transformScreen_piece_tower.onclick = function (){};
                fncOnclick(
                    TransformPieces.TOWER,
                    new Tower(
                        curP,
                        main_color_piece[curP.playerIndex],
                        plate_color_piece[curP.playerIndex],
                        border_color_piece[curP.playerIndex],
                    )
                );
            }
        }
        function onclick_listerner_bishop(event) {
            console.log("ONCLICK BISHOP !");
            if (event) {
                //obj.UI.transformScreen_piece_bishop.removeEventListener('click', onclick_listerner_bishop);
                obj.UI.transformScreen_piece_bishop.onclick = function (){};
                fncOnclick(
                    TransformPieces.BISHOP,
                    new Bishop(
                        curP,
                        main_color_piece[curP.playerIndex],
                        plate_color_piece[curP.playerIndex],
                        border_color_piece[curP.playerIndex],
                        color_piece_second[curP.playerIndex]
                    )
                );
            }
        }
        function onclick_listerner_queen(event) {
            console.log("ONCLICK QUEEN !");
            if (event) {
                //obj.UI.transformScreen_piece_queen.removeEventListener('click', onclick_listerner_queen);
                obj.UI.transformScreen_piece_queen.onclick = function (){};
                fncOnclick(
                    TransformPieces.QUEEN,
                    new Queen(
                        curP,
                        main_color_piece[curP.playerIndex],
                        plate_color_piece[curP.playerIndex],
                        border_color_piece[curP.playerIndex],
                    )
                );
            }
        }

        //this.UI.transformScreen_piece_knight.addEventListener('click', onclick_listerner_knight);
        this.UI.transformScreen_piece_knight.onclick = function (e){onclick_listerner_knight(e);};
        this.UI.transformScreen_piece_knight.src = curP.pieceTOTransformSrc.knight.appearance.image.src;

        //this.UI.transformScreen_piece_bishop.addEventListener('click', onclick_listerner_bishop);
        this.UI.transformScreen_piece_bishop.onclick = function (e){onclick_listerner_bishop(e);};
        this.UI.transformScreen_piece_bishop.src = curP.pieceTOTransformSrc.bishop.appearance.image.src;

        //this.UI.transformScreen_piece_queen.addEventListener('click', onclick_listerner_queen);
        this.UI.transformScreen_piece_queen.onclick = function (e){onclick_listerner_queen(e);};
        this.UI.transformScreen_piece_queen.src = curP.pieceTOTransformSrc.queen.appearance.image.src;

        //this.UI.transformScreen_piece_tower.addEventListener('click', onclick_listerner_tower);
        this.UI.transformScreen_piece_tower.onclick = function (e){onclick_listerner_tower(e);};
        this.UI.transformScreen_piece_tower.src = curP.pieceTOTransformSrc.tower.appearance.image.src;
    }


    //Say if there is a piece between two positions
    noPiecesBetween(p1, p2) {
        let incr = p2.difference(p1);
        let coefX = (incr.x < 0) ? -1 : 1;
        let coefY = (incr.y < 0) ? -1 : 1;

        let nbX = coefX * incr.x;
        let nbY = coefY * incr.y;

        for (let i = 0; i <= nbY; i++) {
            for (let j = 0; j <= nbX; j++) {
                if ((i != 0 || j != 0) && (i != nbY || j != nbX)) {
                    let posToWatch = new Position(p1.x + j * coefX, p1.y + i * coefY);
                    let curCaseToWatch = this.cases[posToWatch.y * this.nb_col + posToWatch.x];

                    if (curCaseToWatch.piece != undefined) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    //Method called when you want to apply changes
    commitChanges() {
        for (let c of this.changedCases) {
            c.onDraw(this.contextboard);
        }
        this.changedCases = [];
    }

    //board draw
    drawBoard(){
        for (let c of  this.cases){
            c.onDraw(this.contextboard);
        }
    }

    //Clear the board states
    clear(withCase) {
        this.contextboard.fillStyle = color_case_black;
        this.contextboard.fillRect(0,0,this.UI.canvas.width,this.UI.canvas.height);

        if(withCase) {
            for (let c of this.cases) {
                c.clearCase();
            }
        }

    }

    /**Basic methods for create changes on the board**/
    //Set a piece to the param Position
    //Assuming this position to be correct
    setAPieces(col, row, piece) {
        let caseInCase = this.cases[col + row * this.nb_col];
        if (!this.changedCases.includes(caseInCase)) {
            this.changedCases.push(caseInCase);
        }
        caseInCase.piece = piece;
    }

    //Set a possible position (true or false)
    //Assuming this position to be correct
    setPossiblePos(col, row, pos) {
        let caseInCase = this.cases[col + row * this.nb_col];
        if (!this.changedCases.includes(caseInCase)) {
            this.changedCases.push(caseInCase);
        }
        caseInCase.possible_pos = pos;
    }

    //Set a possible position ROCK (Association_rock)
    //Assuming this position to be correct
    setPossiblePosRock(col, row, as) {
        let caseInCase = this.cases[col + row * this.nb_col];
        if (!this.changedCases.includes(caseInCase)) {
            this.changedCases.push(caseInCase);
        }
        caseInCase.rock_elem = as;
    }

    //Set a possible pre selected position (true or false)
    //Assuming this position to be correct
    setPossiblePreSelectedPos(col, row, pos) {
        let caseInCase = this.cases[col + row * this.nb_col];
        if (!this.changedCases.includes(caseInCase)) {
            this.changedCases.push(caseInCase);
        }
        caseInCase.pre_selected_pos = pos;
    }

    //Set a possible dangerous position (true or false)
    //Assuming this position to be correct
    setPossibleCaseWithMenaceOnIt(col, row, men) {
        let caseInCase = this.cases[col + row * this.nb_col];
        if (!this.changedCases.includes(caseInCase)) {
            this.changedCases.push(caseInCase);
        }
        caseInCase.is_case_with_menace_on_it = men;
    }

    /**ANIMATION TREATMENT**/
    //Set a list of pieces (on startElem) with a continuous displacement on the board (to endElem)
    animatedDisplacement(startElem, endElem, nbELem, animator) {
        for (let i = 0; i < nbELem; i++) {
            let start = startElem.get(i);
            let end = endElem.get(i);

            //In this func, we will only perform animation visual effect on the board, the gameplay mecanism is performed by onTheEnd
            let p_dep = start.piece;

            this.isPieceMoving = true;
            this.pieceToMove = p_dep;

            if (p_dep != undefined) {
                //Now we can perform the continuous movement of the piece
                animator.drawingElement = p_dep.appearance;
                animator.endBounds = end.bounds;
                animator.launch();
            }
        }
    }

    //Restart the animation
    restart_no_animation_context() {
        this.isPieceMoving = false;
        this.pieceToMove = undefined;
    }
}

//Create custom element
customElements.define("game-board", Board);