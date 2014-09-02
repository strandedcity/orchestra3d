define(["src/SISL/js/sisl","underscore"],function(){
    if (_.isUndefined(Module._newPoint)) console.warn("SISL routine newPoint is missing, but PointComponent depends on it.");
    var newPoint = Module.cwrap('newPoint','number',['number','number','number']);
    var SISL = {};

    SISL.Point = function SISLPoint(x, y, z){
        // Construct C array of the point's coordinates. Optionally pass a 'pointer' to re-use C memory
        var coordsPointer = Module.Utils.copyJSArrayToC([x,y,z]);
        this._pointer = newPoint(coordsPointer,3,0);
        console.log('newPoint pointer: ',this._pointer);
    //    console.log(coordsPointer, this._pointer);
    //    this._pointer = coordsPointer;
    };
    _.extend(SISL.Point.prototype,{
        getPointer: function(){
            return this._pointer;
        },
        getCoords: function(){
            console.log('point pointer',this._pointer);
            var coordsPtr = Module.ccall('pointCoords','number',['number'],[this._pointer]);
            console.log('coords pointer',coordsPtr);
            return new Float32Array(Module.HEAPU8.buffer, coordsPtr, 3);
        },
        destroy: function(){
            Module._free(this._pointer);
        }
    });

    return SISL;
});

