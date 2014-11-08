define(["SISL/sisl_loader","SISL/sisl","underscore"],function(){
    console.warn("NEED A PLACE FOR USER SETTINGS SUCH AS PRECISION!");
    var precision = 0.00001;

    try {
        var newPoint = Module.cwrap('newPoint','number',['number','number','number']);
        var pointCoords = Module.cwrap('pointCoords','number',['number']);
        var newCurve = Module.cwrap('newCurve','number',['number','number','number','number','number','number','number']);
        var s1240 = Module.cwrap('s1240','number',['number','number','number','number']);
        var s1227 = Module.cwrap('s1227','number',['number','number','number','number','number','number']);
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

    Geo.Vect = function GeoVect(x,y,z){
        Geo.Point.apply(this,[x,y,z]);
        return this;
    };
    _.extend(Geo.Vect.prototype,Geo.Point.prototype);
    _.extend(Geo.Vect.prototype,{
        getNormalVectArray: function(){
            // getNormalVect should return a copy of the vector. In a dataflow model, no
            // downstream component should be able to change the value of an upstream component
            var coords = this.getCoordsArray(),
                length = this.getLength();

            return [coords[0]/length,coords[1]/length,coords[2]/length];
        },
        getLength: function(){
            var coords = this.getCoordsArray();
            return Math.sqrt(Math.pow(coords[0],2) + Math.pow(coords[1],2) + Math.pow(coords[2],2) );
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
        if (degree >= controlPoints.length) {throw new Error("Curve degree must be smaller than the number of control points");}
        // By definition, from http://en.wikipedia.org/wiki/Non-uniform_rational_B-spline
        // #knots = #control pts + curve order
        // curve order = degree + 1
        // knot vectors look like [0,0,1,2,3,3]

        // Preparing data for geometry library:
        var vertexCount = controlPoints.length,
            curveOrder = degree + 1,
            ikind = 1,
            dimension = 3, // always
            icopy = 0, // we're making a copy from the javascript already.
            knotVector = [], knotVectorPointer,
            vertices = [], verticesPointer;

        // Pile control point values into a single array, push that to C heap. THIS SHOULD BE A C FUNCTION!
        console.warn("Stacking points into a single array must be SUPER efficient.");
        _.each(controlPoints,function(pt){
            vertices = vertices.concat(pt.getCoordsArray());
        });

        // Knot vector must be generated... there are a couple ways we might do this, but the simplest is:
        knotVector = Module.Utils.generateUniformKnotVector(vertexCount,curveOrder);

        // copy knotvector, get pointer:
        knotVectorPointer = Module.Utils.copyJSArrayToC(knotVector);
        verticesPointer = Module.Utils.copyJSArrayToC(vertices);

        this._pointer = newCurve(vertexCount,curveOrder,knotVectorPointer,verticesPointer,ikind,dimension,icopy);
        console.log('new curve: ',this._pointer);
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
        getPositionAt: function (param) {
            if (typeof param === "undefined") {throw new Error("Curve parameter must be defined");}
            // void s1227(*curve, int #derivatives to compute: 0=position 1=tangent, parvalue, *leftknot (opt), double[] derive, *stat))
            var buffer = Module._malloc(16*3);
            s1227(this._pointer,0,param,0,buffer,0);
            var position = Module.Utils.copyCArrayToJS(buffer,3);
            return new Geo.Point(position[0],position[1],position[2]);
        },
        getTangentAt: function(param){
            if (typeof param === "undefined") {throw new Error("Curve parameter must be defined");}
            var buffer = Module._malloc(16*6);
            s1227(this._pointer,1,param,0,buffer,0);
            var derivs = Module.Utils.copyCArrayToJS(buffer,6);
            var tangent = new Geo.Vect(derivs[3],derivs[4],derivs[5]);
            return tangent;
        },
        destroy: function(){
            Module._free(this._pointer);
        }
    });

    return Geo;
});

