define(["SISL/sisl_loader","SISL/sisl","underscore","threejs"],function(){
    console.warn("NEED A PLACE FOR USER SETTINGS SUCH AS PRECISION!");
    var precision = 0.00001;

    try {
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

        THREE.Vector3.apply(this,[x,y,z]);

        // legacy from using SISLPoints instead of THREE.Vector3's here
        this.getCoordsArray = function(){
            return [this.x,this.y,this.z];
        };

        this.destroy = function(){
            // No manual memory management for this object currently
        }
    };

    // Inherit all THREE.Vector3 stuff, then reset the constructor name. Wrapping THREE.Vector3 gives us
    // an easy place to customize the vector for this context.
    _.extend(Geo.Point.prototype, THREE.Vector3.prototype);
    Geo.Point.prototype.constructor = Geo.Point;

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

        // Points are stored as THREE.JS objects as of 12/21/14. This gives free affine transforms for all
        // SISL objects with no muss, but this would all probably be faster if the affine transform stuff
        // were instead ported into C-land.
        _.each(controlPoints,function(pt){
            vertices = vertices.concat(pt.getCoordsArray());
        });

        // Knot vector must be generated... there are a couple ways we might do this, but the simplest is:
        knotVector = Module.Utils.generateUniformKnotVector(vertexCount,curveOrder);

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
            var tangent = new Geo.Point(derivs[3],derivs[4],derivs[5]);
            return tangent;
        },
        destroy: function(){
            Module._free(this._pointer);
        }
    });

    return Geo;
});

