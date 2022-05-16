/* ==================================================================================
    DRAWING FILE
      => all drawing features to help manipulating graphics for rendering
================================================================================== */

const imagePathFolderName = "../res/drawable/";

let global_cpt_elements         = [];
let global_cpt_elements_limits  = [];
let cpt_elements                = 0;
let cpt_loaded                  = 0;

//https://webglfundamentals.org/webgl/lessons/webgl-cors-permission.html
/**Function for request an image if it's not from local region
 * @param img : Image requested
 * @param url : String url of the ressource image**/
function requestCORSIfNotSameOrigin(img, url) {
    if ((new URL(url, window.location.href)).origin !== window.location.origin) {
        img.crossOrigin = "";
    }
}


function getDrawableSRC(stringName) {
    let curFolder = imagePathFolderName + "pieces/";
    //console.log("DRAWING SRC REQUEST : " + curFolder+stringName);
    return curFolder + stringName;
}

function getDrawableSRCNormalImg(stringName) {
    let curFolder = imagePathFolderName + "img/";
    return curFolder + stringName;
}



class LayerDrawing {
    constructor(drawableSRC, fillcolor, strokecolor) {
        this.src            = drawableSRC;
        this.fillcolor      = fillcolor;
        this.strokecolor    = strokecolor;

        this.bounds = {
            left : 0,
            top : 0,
            right : 0,
            bottom : 0,
        }

        this.image = undefined;
    }

    setBounds(left, top, right, bottom){
        this.bounds.left = left;
        this.bounds.top = top;
        this.bounds.right = right;
        this.bounds.bottom = bottom;
    }

    draw(context, callback){
        if(this.image === undefined){
            //console.log("  =>layer : NEED TO RECOMPUTE !");
            this.image         = new Image();
            var obj            = this;

            var xhr = new XMLHttpRequest();

            xhr.onload = function() {
                // get the XML tree of the SVG
                var svgAsXml = xhr.responseXML;
                // do some modifications to the XML tree
                var element = svgAsXml.getElementById('style');

                if(element) {
                    element.style.fill      = obj.fillcolor;
                    element.style.stroke    = obj.strokecolor;
                    // convert the XML tree to a string
                    var svgAsString = new XMLSerializer().serializeToString(svgAsXml);
                    // create a new image with the svg string as an ObjectUrl
                    var svgBlob     = new Blob([svgAsString], {type: "image/svg+xml;charset=utf-8"});
                    var url         = window.URL.createObjectURL(svgBlob);

                    obj.image.onload = function () {
                        context.drawImage(this, obj.bounds.left, obj.bounds.top, obj.bounds.right, obj.bounds.bottom);
                        window.URL.revokeObjectURL(svgBlob);

                        //Apply callback if needed
                        if (callback) callback();
                        else console.log("no callback found");
                    }
                    obj.image.src     = url;
                }else{
                    console.log("no elem found !");
                }
            }

            //console.log(this.src);

            xhr.open("GET", this.src);
            xhr.responseType = "document";
            xhr.send();

        }else{
            //console.log("  =>layer : NO NEED TO RECOMPUTE !");
            context.drawImage(this.image, this.bounds.left, this.bounds.top, this.bounds.right, this.bounds.bottom);
            if(callback) callback();
        }
    }
}

//From DOM elem or XML data structure
function getSVGContents(inputString){
    let domParser = new DOMParser();
    let svgDOM = domParser.parseFromString(inputString, 'text/xml').getElementsByTagName('svg')[0];
    return svgDOM.innerHTML
}

class ComposedDrawing {

    constructor() {
        this.ID = cpt_elements;
        cpt_elements++;
        global_cpt_elements.push(0);
        global_cpt_elements_limits.push(0);

        this.layers = [];
        this.bounds = {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
        }

        this.hasChanged = false;
        this.image = undefined;
    }

    setBounds(left, top, right, bottom) {
        this.bounds.left = left;
        this.bounds.top = top;
        this.bounds.right = right;
        this.bounds.bottom = bottom;
    }

    addLayer(drawableSRC, fillcolor, strokecolor) {
        this.layers.push(new LayerDrawing(drawableSRC, fillcolor, strokecolor));
        this.hasChanged = true;

        global_cpt_elements_limits[this.ID]++;
    }

    clear() {
        this.layers = [];
    }

    isInstancied() {
        return this.layers.length > 0;
    }

    draw(context){
        //this.layers.forEach(elem =>{
        //    elem.setBounds(bounds.left, bounds.top, bounds.right, bounds.bottom);
        //    elem.draw(context);
        //})

        //console.log("DRAW LAYERED DRAW ! ");
        let img = this.loadImageRepresentation(context);
        //console.log(img);
        //console.log(this);

        if(img) context.drawImage(img, this.bounds.left, this.bounds.top, this.bounds.right, this.bounds.bottom);
        //else console.log("WAIT UNTIL COMPLETE LOAD !");
    }

    loadImageRepresentation(context_complex){
        //console.log("====   LOAD IMAGE REPRESENTATION   ====");
        //console.log(this.hasChanged);
        //console.log(this.image);

        if(this.layers.length != 0 && (this.hasChanged || this.image === undefined)) {
            this.canvas_el          = document.createElement("canvas");
            this.canvas_el.width    = this.bounds.right;
            this.canvas_el.height   = this.bounds.bottom;
            this.contextDrawing     = this.canvas_el.getContext('2d');

            this.hasChanged = false;
            //console.log("=>complex drawing : NEED TO COMPUTE !");

            let bounds = {
                left: 0,
                right:  this.canvas_el.width,
                bottom: this.canvas_el.height,
                top: 0
            }

            global_cpt_elements[this.ID] = 0;
            this.image = new Image();

            this.image.onload = function () {
                context_complex.drawImage(this, obj_complex.bounds.left, obj_complex.bounds.top, obj_complex.bounds.right, obj_complex.bounds.bottom);
            }

            let obj_complex     = this;
            for (let i = 0; i < this.layers.length; i++) {
                this.layers[i].setBounds(bounds.left, bounds.top, bounds.right, bounds.bottom);
                this.layers[i].draw(
                    obj_complex.contextDrawing,
                    () => {
                        global_cpt_elements[obj_complex.ID]++;
                        //console.log("IM SEEING : " + obj_complex.ID);
                        if (global_cpt_elements[obj_complex.ID] == (global_cpt_elements_limits[obj_complex.ID])) {
                            obj_complex.image.src = obj_complex.canvas_el.toDataURL("image/png");
                        }
                    }
                );
            }
        }else{
            //console.log("=>complex drawing : NO NEED TO COMPUTE !");
            return this.image;
        }
    }

    constructImageXMLDOM() {
        this.SVGimg = "";
        var obj = this;

        for (let el of this.layers) {
            console.log(el);

            var xhr = new XMLHttpRequest();

            xhr.onload = function () {
                var svgAsXml = xhr.responseXML;
                var element = svgAsXml.getElementById('style');
                if (element) {
                    obj.SVGimg +=svgAsXml;
                }
            }
            xhr.open("GET", el.src);
            xhr.responseType = "document";
            xhr.send();
        }
    }
}