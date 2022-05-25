/* ==================================================================================
    ANIMATION BEHAVIORS
================================================================================== */
import {Board} from "./Board.js";

export const AnimationWay = {
    NORMAL : 0,
    EASEOUT : 0,
    EASEINOUT : 0,
}

export const AnimationFunction = {
    LERP : 0,
    SINLERP : 1,
    CIRC : 2,
    BACK : 3,
    BOUNCE : 4,
    ELASTIC : 5,
    QUAD : 6,
}

//=========== Time interpolation AnimationFunction
let nb_x_id = 4;

function lerp(t){
    return  t;
}

function sin_lerp(t){
    //console.log("SIN-LERP : " + t);
    return Math.sin(t*Math.PI);
}

function circ(t) {
    return 1 - Math.sin(Math.acos(t));
}

function back(t) {
    let x = nb_x_id;
    return Math.pow(t, 2) * ((x + 1) * t - x)
}

function bounce(t) {
    for (let a = 0, b = 1; 1; a += b, b /= 2) {
        if (t >= (7 - 4 * a) / 11) {
            return -Math.pow((11 - 6 * a - 11 * t) / 4, 2) + Math.pow(b, nb_x_id)
        }
    }
}

function elastic(t) {
    return Math.pow(2, 10 * (t - 1)) * Math.cos(20 * Math.PI * nb_x_id / 3 * t)
}

function quad(timeFraction) {
    return Math.pow(timeFraction, nb_x_id);
}



//=========== EASING FUNCTIONS
//REVERSE ANIMATION
function makeEaseOut(timing) {
    return function(timeFraction) {
        return 1 - timing(1 - timeFraction);
    }
}

//BOTH WAY ANIMATION
function makeEaseInOut(timing) {
    return function(timeFraction) {
        if (timeFraction < .5)
            return timing(2 * timeFraction) / 2;
        else
            return (2 - timing(2 * (1 - timeFraction))) / 2;
    }
}


export class AnimatorBoard {

    //Going from 0 to duration
    constructor(duration, board) {
        this.duration = duration;

        this.way            = AnimationWay.EASEOUT;
        this.animationFNC   = AnimationFunction.CIRC;

        this.drawingElement = undefined;
        this.endBounds      = undefined;

        this.startTime      = undefined;
        this.animationOn    = false;

        this.board          = board;
        this.canvasContext  = this.board.contextboard;

        this.animation_cpt      = 0;
        this.animation_loop_cpt = 1;
    }

    setWayAnimationFunction(way){
        this.way = way;
    }

    setFncAnimation(anim){
        this.animationFNC = anim;
    }


    getWay(fnt){
        switch (this.way){
            case AnimationWay.NORMAL:
                return fnt;
            case AnimationWay.EASEOUT:
                return makeEaseOut(fnt);
            case AnimationWay.EASEINOUT:
                return makeEaseInOut(fnt);
        }
    }

    getVal(t){
        //console.log("GET VAL");
        //console.log(this.animationFNC);

        switch (this.animationFNC){
            case AnimationFunction.LERP :
                return this.getWay(lerp)(t);
            case AnimationFunction.SINLERP :
                return this.getWay(sin_lerp)(t);
            case AnimationFunction.CIRC :
                return this.getWay(circ)(t);
            case AnimationFunction.BACK :
                return this.getWay(back)(t);
            case AnimationFunction.BOUNCE :
                return this.getWay(bounce)(t);
            case AnimationFunction.ELASTIC :
                return this.getWay(elastic)(t);
            case AnimationFunction.QUAD :
                return this.getWay(quad)(t);
        }
    }

    onStart(){}
    onEnd(){}

    launch(){
        this.onStart();
        this.animationOn = true;
        let obj = this;

        let start_pos   = this.drawingElement.bounds;

        let end_pos     = this.endBounds;

        this.id = requestAnimationFrame((t)=> animationCycle(t,obj, {
            left    : start_pos.left,
            right   : start_pos.right,
            top     : start_pos.top,
            bottom  : start_pos.bottom,
        }, end_pos));
    }
}

let aff = true;
function animationCycle(t, object, start, end) {
    //console.log(object);
    //console.log(object.board);

    //console.log(t);

    if (object.startTime === undefined) object.startTime = t;
    let relativeTime = (t - object.startTime) / object.duration;

    //console.log(relativeTime);

    if (relativeTime <= 1) {

        //Draw elements
        object.board.clear();
        object.board.drawBoard();

        let valAnim = ((object.getVal)(relativeTime));

        object.drawingElement.bounds.right    = start.right     + (end.right -  start.right)    * valAnim;
        object.drawingElement.bounds.left     = start.left      + (end.left -   start.left)     * valAnim;
        object.drawingElement.bounds.top      = start.top       + (end.top -    start.top)      * valAnim;
        object.drawingElement.bounds.bottom   = start.bottom    + (end.bottom - start.bottom)   * valAnim;

        //Draw the element
        object.drawingElement.draw(object.canvasContext);
        //console.log(object.drawingElement);

        //LOOP
        object.id = requestAnimationFrame((t)=> animationCycle(t,object, start, end));

    } else if (object.animationOn) {
        cancelAnimationFrame(object.id);
        object.animationOn = false;
        object.animation_cpt++;

        if (object.animation_cpt<object.animation_loop_cpt) {
            object.startTime = t;
            requestAnimationFrame((t)=> animationCycle(t,object, start, end));
        }else{
            object.onEnd();
        }
    }
}
