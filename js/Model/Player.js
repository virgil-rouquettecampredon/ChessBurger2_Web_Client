/* ==================================================================================
    PLAYER BEHAVIORS
================================================================================== */

class Player {
    constructor(pseudo, color) {
        this.piecesPlayer   = new Map();
        this.rockPieces     = new Map();
        this.cimetary       = [];

        this.pseudo         = pseudo;
        this.color          = color;

        this.UI = {};

        this.createHTMLUI();

        this.playerIndex = 0;

        this.pieceTOTransformSrc = {};
    }

    isAlly(player) {
        return player === this;
    }
    getPiecesPlayer() {
        return Array.from(this.piecesPlayer.keys());
    }
    addPiece(piece) {
        this.piecesPlayer.set(piece, []);
    }
    removePiece(piece) {
        this.piecesPlayer.delete(piece);
    }
    killAPiece(piece) {
        this.removePiece(piece);
        this.cimetary.push(piece);
    }
    destroyAPiece(piece) {
        this.piecesPlayer.delete(piece);

        let elemfound = -1;
        for (let i = 0; i <this.cimetary.length ; i++) {
            if (this.cimetary[i] === piece) {
                elemfound = i;
            }
        }
        if (elemfound !== -1) {
            this.cimetary.splice(elemfound,1);
        }
    }
    reviveAPiece(piece) {
        //console.log("REVIVE A PIECE PLAYER !");
        let elemfound = -1;
        for (let i = 0; i <this.cimetary.length ; i++) {
            if (this.cimetary[i] === piece) {
                elemfound = i;
            }
        }

        if (elemfound !== -1) {
            let el = this.cimetary[elemfound];
            this.cimetary.splice(elemfound,1);
            this.addPiece(el);
        }
    }
    isAlive(piece) {
        for (let elem of this.cimetary) {
            if (elem === piece) {
                return false;
            }
        }
        return true;
    }

    /** ======== Pieces Movement ======== **/
    resetPossibleMove() {
        let array = Array.from(this.piecesPlayer.keys());
        for (let p of array) {
            this.piecesPlayer.set(p, []);
        }
    }
    setPossibleMove(piece, pos) {
        this.piecesPlayer.set(piece, pos);
    }
    getPositionsPiece(piece) {
        return this.piecesPlayer.get(piece) ?? [];
    }

    /** ======== Rock Management ======== **/
    addRockPieces(pieceRock, associationRock) {
        let list = this.rockPieces.get(pieceRock);
        if (list !== undefined) {
            list.push(associationRock);
        } else {
            let l = [];
            l.push(associationRock);
            this.rockPieces.set(pieceRock, l);
        }
    }
    getPiecesToRock() {
        return Array.from(this.rockPieces.keys());
    }
    getAssoToRockWithPiece(piece) {
        return this.rockPieces.get(piece);
    }


    /** ======== Generate UI HTML ======== **/
    createHTMLUI(){
        let root_ui = document.getElementById("gameUI");

        this.UI.playerCard = document.createElement("div");
        this.UI.playerCard.setAttribute("class", "row");

        //d_wrapper.style.margin = "20px";
        let card_wrapper = document.createElement("div");
        card_wrapper.setAttribute("class", "card");
        let card_body = document.createElement("div");
        card_body.setAttribute("class", "card-body");
        let wrapper_elm = document.createElement("div");
        wrapper_elm.setAttribute("class", "row");

        let wrapper_img = document.createElement("div");
        wrapper_img.setAttribute("class","col-lg-4 col-md-4 col-12");
        let img_place = document.createElement("div");
        img_place.setAttribute("class","float-md-right");

        this.UI.profilPic   = document.createElement("img");
        this.UI.profilPic.setAttribute("class","rounded-circle");

        this.UI.profilPic.src = getDrawableSRCNormalImg("avatar.png");
        this.UI.profilPic.alt = "profile pic";
        this.UI.profilPic.style.maxWidth = "100%";
        this.UI.profilPic.style.maxHeight = "auto";
        img_place.appendChild(this.UI.profilPic);
        wrapper_img.appendChild(img_place);
        wrapper_elm.appendChild(wrapper_img);


        let wrapper_datas = document.createElement("div");
        wrapper_datas.setAttribute("class","col-lg-8 col-md-8 col-12");

        this.UI.nameSpace   = document.createElement("h2");
        this.UI.nameSpace.setAttribute("class","m-t-0 m-b-0");
        this.UI.nameSpace.innerHTML = "<strong>" + this.pseudo + "</strong>";
        wrapper_datas.appendChild(this.UI.nameSpace);

        this.UI.cimetary_1  = document.createElement("div");
        this.UI.cimetary_1.setAttribute("class","row");
        this.UI.cimetary_2  = document.createElement("div");
        this.UI.cimetary_2.setAttribute("class","row");

        for (let i = 0; i < 8; i++) {
            let div = document.createElement("div");
            div.setAttribute("class", "col");

            let div_2 = document.createElement("div");
            div_2.setAttribute("class", "col");
            this.UI.cimetary_1.appendChild(div);
            this.UI.cimetary_2.appendChild(div_2);
        }

        wrapper_datas.appendChild(this.UI.cimetary_1);
        wrapper_datas.appendChild(this.UI.cimetary_2);
        wrapper_elm.appendChild(wrapper_datas);
        card_body.appendChild(wrapper_elm);
        card_wrapper.appendChild(card_body);
        this.UI.playerCard.appendChild(card_wrapper);
        root_ui.appendChild(this.UI.playerCard);
    }
    UI_setName(name){
        this.pseudo = name;
        this.UI.nameSpace = this.pseudo;
    }
    UI_setPorfilPicFromLocalFile(src){
        this.UI.profilPic.src = src;
    }
    UI_draw(elem){
        elem.appendChild(this.UI.playerCard);
    }
}