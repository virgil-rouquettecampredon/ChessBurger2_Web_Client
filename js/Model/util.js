// ====== UTILS FUNCTIONS
export let colorPrimary = "#A4C2AF7B";
export let colorPrimaryVariant = "#C2AF7B";
export let colorPrimaryVariantDark = "#695b35";
export let colorSecondary = "#7BC2BE";
export let colorSecondaryVariant = "#326966";
export let colorTertiary = "#C27BA0";
export let colorTertiaryVariant = "#741B47";


export function getLinearCursorPosition(canvas, event) {
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



export function disableScrolling(){
    var x=window.scrollX;
    var y=window.scrollY;
    window.onscroll=function(){window.scrollTo(x, y);};
}

export function enableScrolling(){
    window.onscroll=function(){};
}