define(["SISL/sisl_loader","SISL/module_utils","underscore","threejs"],function(){
    console.warn("NEED A PLACE FOR USER SETTINGS SUCH AS PRECISION!");
    var precision = 0.00001;

    try {
        var newCurve = Module.cwrap('newCurve','number',['number','number','number','number','number','number','number']);
        var freeCurve = Module.cwrap('freeCurve','number',['number']);
        var s1240 = Module.cwrap('s1240','number',['number','number','number','number']);
        var s1227 = Module.cwrap('s1227','number',['number','number','number','number','number','number']);
        var s1303 = Module.cwrap('s1303','number',['number','number','number','number','number','number','number','number']);
    } catch (e) {
        throw new Error("Missing SISL dependency encountered.")
    }


    var unitZ = new THREE.Vector3(0,0,1),
        unitScale = new THREE.Vector3(1,1,1);

    var Geo = {};

    Geo.Utils = {
        transformMatrixFromNormalAndPosition: function(normal,position){
            var quaternion = new THREE.Quaternion().setFromUnitVectors(unitZ.clone(),normal.clone().normalize());
                return (new THREE.Matrix4()).compose(position.clone(),quaternion,unitScale);
        }
    };

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
            icopy = 2, // set pointer and remember to free arrays
            knotVector, knotVectorPointer,
            vertices = [], verticesPointer;

        // Points are stored as THREE.JS objects as of 12/21/14. This gives free affine transforms for all
        // SISL objects with no muss, but this would all probably be faster if the affine transform stuff
        // were instead ported into C-land.
        _.each(controlPoints,function(pt){
            vertices.push(pt.x,pt.y,pt.z);
        });

        // Knot vector must be generated... there are a couple ways we might do this, but the simplest is:
        knotVector = Module.Utils.generateUniformKnotVector(vertexCount,curveOrder);

        // copy knotvector, get pointer:
        knotVectorPointer = Module.Utils.copyJSArrayToC(knotVector);
        verticesPointer = Module.Utils.copyJSArrayToC(vertices);

        this._pointer = newCurve(vertexCount,curveOrder,knotVectorPointer,verticesPointer,ikind,dimension,icopy);
    };

    var curveMethods = {
        getLength: function(){
            // corresponds to s1240: void s1240(*curve, double precision, *result length, *result stat(>0= warning, 0=ok, <0=error))
            var buffer = Module._malloc(16);
            s1240(this._pointer,precision,buffer,0);
            var len = Module.getValue(buffer,'double');
            Module._free(buffer);
            return len;
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
            Module._free(buffer);
            return new Geo.Point(position[0],position[1],position[2]);
        },
        getTangentAt: function(param){
            if (typeof param === "undefined") {throw new Error("Curve parameter must be defined");}
            var buffer = Module._malloc(16*6);
            s1227(this._pointer,1,param,0,buffer,0);
            var derivs = Module.Utils.copyCArrayToJS(buffer,6);
            var tangent = new Geo.Point(derivs[3],derivs[4],derivs[5]);
            Module._free(buffer);
            return tangent;
        },
        destroy: function(){
            freeCurve(this._pointer);
        }
    };

    Geo.CircleCNR = function CircleCNR(center,normal,radius){
        // JS wrapper to make the SISL code go.
        // s1303(startPoint[3], precision, angle, centerPoint[3], normalAxis[3], dimension, **resultCurve, &stat);
        // NOTES:
        // double startpt[3] // point on circle where arc starts
        // double angle // arc angle, full circle if < −2π, +2π >

        // startpt must be calculated from the radius (which I want to supply) and the normal
        // (that we have). It's a point on the circle, but isn't simple addition unless the circle is flat
        // This calculation (get rotation matrix, get translate matrix, apply it to the startpoint) is very
        // heavy for what it does, but is also very generic.
        var transformMatrix = Geo.Utils.transformMatrixFromNormalAndPosition(normal,center);

        // Use this transformation matrix to calculate a start point on the circle
        var flatRadius = new THREE.Vector3(radius,0,0),
            start = flatRadius.applyMatrix4(transformMatrix);


        var startpt = Module.Utils.copyJSArrayToC([start.x,start.y,start.z]),
            angle = 10, // just bigger than 2pi, to close the circle
            centrept = Module.Utils.copyJSArrayToC([center.x,center.y,center.z]),
            axis = Module.Utils.copyJSArrayToC([normal.x,normal.y,normal.z]),
            dim = 3,
            ptr = Module._malloc(16*7); /* This may be wrong, but I believe it's the size of the SISLCurve Struct */

        s1303(startpt, precision, angle, centrept, axis, dim, ptr, 0);

        // store the pointer for later use. s1303 takes a pointer to a pointer, so this._pointer needs to be retrieved
        this._pointer = Module.getValue(ptr, 'i8*');
    };

    _.extend(Geo.Curve.prototype,curveMethods);
    _.extend(Geo.CircleCNR.prototype,curveMethods);

    return Geo;
});

