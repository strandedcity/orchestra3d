define(["src/SISL/js/sisl","underscore"],function(){
    if (_.isUndefined(Module._newPoint)) console.warn("SISL routine newPoint is missing, but PointComponent depends on it.");
    var newPoint = Module.cwrap('newPoint','number',['number','number','number']);
    var Geo = {};

    Geo.Point = function GeoPoint(x, y, z){
        if (typeof x !== "number" || typeof y !== "number" || typeof z !== "number") {
            throw new Error("Must pass 3 numbers to create a Point");
        }

        // Construct C array of the point's coordinates. Optionally pass a 'pointer' to re-use C memory
        var coordsPointer = Module.Utils.copyJSArrayToC([x,y,z]);
        this._pointer = newPoint(coordsPointer,3,0);
    };
    _.extend(Geo.Point.prototype,{
        getPointer: function(){
            return this._pointer;
        },
        getCoords: function(){
            //console.log('point pointer',this._pointer);
            var coordsPtr = Module.ccall('pointCoords','number',['number'],[this._pointer]);
            //console.log('coords pointer',coordsPtr);
            return new Float32Array(Module.HEAPU8.buffer, coordsPtr, 3);
        },
        getCoordsArray: function(){
            return Array.apply([],this.getCoords());
        },
        destroy: function(){
            Module._free(this._pointer);
        }
    });

    // SISLCurve *newCurve (vertex_count, curve_order, *knotvector, *vertices, ikind, dimension, icopy)
    // ikind: 1=polynomial b-spline, 2=rational b-spline, 3=polynomial bezier, 4=rational bezier
    // icopy: 0=Set pointer to input arrays, 1=Copy input arrays, 2=Set pointer and remember to free arrays.
    Geo.Curve = function GeoCurve(controlPoints, degree, closed){};

    return Geo;
});

