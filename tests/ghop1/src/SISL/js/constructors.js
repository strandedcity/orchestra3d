define(["src/SISL/js/sisl","underscore"],function(){
    console.warn("NEED A PLACE FOR USER SETTINGS SUCH AS PRECISION!");
    var precision = 0.01;

    try {
        var newPoint = Module.cwrap('newPoint','number',['number','number','number']);
        var pointCoords = Module.cwrap('pointCoords','number',['number']);
        var newCurve = Module.cwrap('newCurve','number',['number','number','number','number','number','number','number']);
        var s1240 = Module.cwrap('s1240','number',['number','number','number','number']);
    } catch (e) {
        throw new Error("Missing SISL dependency encountered.")
    }

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
        getCoordsArray: function(){
            return Module.Utils.copyCArrayToJS(pointCoords(this._pointer),3);
        },
        destroy: function(){
            Module._free(this._pointer);
        }
    });

    // SISLCurve *newCurve (vertex_count, curve_order, *knotvector, *vertices, ikind, dimension, icopy)
    // ikind: 1=polynomial b-spline, 2=rational b-spline, 3=polynomial bezier, 4=rational bezier
    // icopy: 0=Set pointer to input arrays, 1=Copy input arrays, 2=Set pointer and remember to free arrays.
    Geo.Curve = function GeoCurve(controlPoints, degree, periodic){
        // validate inputs
        var controlPointsPass = true;
        if (!_.isArray(controlPoints) || controlPoints.length < 2) {
            controlPointsPass = false;
        } else {
            _.each(controlPoints, function(pt){
                if (pt.constructor.name !== "GeoPoint"){
                    controlPointsPass = false;
                }
            });
        }
        if (!controlPointsPass) {throw new Error("Controlpoints must be an array of at least 2 Geo.Point objects");}
        if (typeof degree !== "number" || degree % 1 !== 0) {throw new Error("Curve degree must be an integer");}
        if (typeof periodic !== "boolean") {throw new Error("Periodic must be a boolean");}

        // By definition, from http://en.wikipedia.org/wiki/Non-uniform_rational_B-spline
        // #knots = #control pts + curve order
        // curve order = degree + 1
        // knot vectors look like [0,0,1,2,3,3]

        // Preparing data for geometry library:
        var vertexCount = controlPoints.length,
            curveOrder = degree + 1,
            ikind = 3, // polynomial bezier by default?
            dimension = 3, // always
            icopy = 0,
            knotVector = [], knotVectorPointer,
            vertices = [], verticesPointer;

        // Pile control point values into a single array, push that to C heap. THIS SHOULD BE A C FUNCTION!
        console.warn("Stacking points into a single array must be SUPER efficient.");
        _.each(controlPoints,function(pt){
            vertices = vertices.concat(pt.getCoordsArray());
        });

        // Pile up a generic knot vector. There are 2 zeros to start, and two of the last digit.
        // There should be even spacing between all numbers so that all control points have equal weight.
        knotVector.push(0);
        knotVector.push(0);
        var i = 1;
        for (i; i<curveOrder+controlPoints.length-2;i++) {
            knotVector.push(i);
        }
        knotVector.push(i);
        knotVector.push(i);

        // copy knotvector, get pointer:
        knotVectorPointer = Module.Utils.copyJSArrayToC(knotVector);
        verticesPointer = Module.Utils.copyJSArrayToC(vertices);

        this._pointer = newCurve(vertexCount,curveOrder,knotVectorPointer,verticesPointer,ikind,dimension,icopy);
    };
    _.extend(Geo.Curve.prototype,{
        getLength: function(){
            // corresponds to s1240: void s1240(*curve, double precision, *result length, *result stat(>0= warning, 0=ok, <0=error))
            var buffer = Module._malloc(16);
            s1240(this._pointer,precision,buffer,0);
            return Module.getValue(buffer,'double');
        },
        getPointer: function(){
            return this._pointer;
        },
        destroy: function(){
            Module._free(this._pointer);
        }
    });

    return Geo;
});

