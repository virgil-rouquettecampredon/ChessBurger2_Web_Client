
let colorPrimary = "#A4C2AF7B";
let colorPrimaryVariant = "#C2AF7B";
let colorPrimaryVariantDark = "#695b35";

let colorSecondary = "#7BC2BE";
let colorSecondaryVariant = "#326966";

let colorTertiary = "#C27BA0";
let colorTertiaryVariant = "#741B47";


function getLinearCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    return {
        xcoord : x/(rect.right - rect.left),
        ycoord : y/(rect.bottom - rect.top),
    }
}

// Adding peek method to the Array
// prototype chain
Array.prototype.peek = function () {
    if (this.length === 0) {
        throw new Error("out of bounds");
    }
    return this[this.length - 1];
};

Array.prototype.add = function (el) {
    this.push(el);
};


//Array.prototype.remove = function (el){
//    this.filter((val) => val !== el);
//}
