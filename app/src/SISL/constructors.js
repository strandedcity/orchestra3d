define(["SISL/sisl_loader","SISL/module_utils","underscore","threejs"],function(){
    console.warn("NEED A PLACE FOR USER SETTINGS SUCH AS PRECISION!");
    var precision = 0.00001;

    try {
        var newCurve = Module.cwrap('newCurve','number',['number','number','number','number','number','number','number']);
        var freeCurve = Module.cwrap('freeSISLCurve','number',['number']);
        var curveParametricEnd = Module.cwrap('curveParametricEnd','number',['number']);
        var curveParametricStart = Module.cwrap('curveParametricStart','number',['number']);
        var s1240 = Module.cwrap('s1240','number',['number','number','number','number']);
        var s1227 = Module.cwrap('s1227','number',['number','number','number','number','number','number']);
        var s1303 = Module.cwrap('s1303','number',['number','number','number','number','number','number','number','number']);
        var s1356 = Module.cwrap('s1356','number',['number','number','number','number','number','number','number','number','number','number','number','number','number','number']);
    } catch (e) {
        throw new Error("Missing SISL dependency encountered.")
    }

    function validateControlPointList(controlPoints){
        var controlPointsPass = true;
        if (!_.isArray(controlPoints) || controlPoints.length < 2) {
            controlPointsPass = false;
        } else {
            _.each(controlPoints, function(pt){

                if (pt.constructor !== THREE.Vector3){
                    controlPointsPass = false;
                }
            });
        }
        if (!controlPointsPass) {throw new Error("Controlpoints must be an array of at least 2 Vector3 objects");}
    }

    function flattenPointList(points){
        var arr=[];
        for (var i=0; i< points.length; i++){
            arr.push(points[i].x,points[i].y,points[i].z);
        }
        return arr;
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

    Geo.Point = THREE.Vector3;
    Geo.Point.prototype.destroy = function(){
        /* This is a no-op for now, but for completeness we should be able to clean up all non base-type objects */
    };

    // SISLCurve *newCurve (vertex_count, curve_order, *knotvector, *vertices, ikind, dimension, icopy)
    // ikind: 1=polynomial b-spline, 2=rational b-spline, 3=polynomial bezier, 4=rational bezier
    // icopy: 0=Set pointer to input arrays, 1=Copy input arrays, 2=Set pointer and remember to free arrays.
    Geo.Curve = function GeoCurve(controlPoints, degree, periodic){
        // validate inputs
        validateControlPointList(controlPoints);
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
            vertices = flattenPointList(controlPoints), verticesPointer;

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
        getMaxParameter: function(){
            if (typeof this.maxParam === "number") {
                return this.maxParam;
            }
            return curveParametricEnd(this._pointer) - 1;
        },
        getMinParameter: function(){
            if (typeof this.minParam === "number") {
                return this.minParam;
            }
            return curveParametricStart(this._pointer) + 1;
        },
        getPositionAt: function (param) {
            var evaluation = this._evalAt(param);
            return new Geo.Point(evaluation[0],evaluation[1],evaluation[2]);
        },
        getTangentAt: function(param){
            var evaluation = this._evalAt(param);
            return new Geo.Point(evaluation[3],evaluation[4],evaluation[5]);
        },
        _evalAt: function(param){
            // void s1227(*curve, int #derivatives to compute: 0=position 1=tangent, parvalue, *leftknot (opt), double[] derive, *stat))
            if (typeof param === "undefined") {throw new Error("Curve parameter must be defined");}
            var buffer = Module._malloc(16*6);
            s1227(this._pointer,1,param,0,buffer,0);
            var derivs = Module.Utils.copyCArrayToJS(buffer,6);
            Module._free(buffer);
            return derivs;
        },
        destroy: function(){
            //console.warn('freeCurve needs fixing');
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
//        console.log('params: ',center,normal,radius);
//console.trace();
        s1303(startpt, precision, angle, centrept, axis, dim, ptr, 0);

        // store the pointer for later use. s1303 takes a pointer to a pointer, so this._pointer needs to be retrieved
        this._pointer = Module.getValue(ptr, 'i8*');
    };

    Geo.CurveInterpolated = function CurveInterpolated(pointList,degree,periodic){
        validateControlPointList(pointList);
        if (typeof degree !== "number" || degree % 1 !== 0) {throw new Error("Curve degree must be an integer");}
        if (typeof periodic !== "boolean") {throw new Error("Periodic must be a boolean");}

        // not sure what to do with this functon. It's stupid, but I don't need this parameter and have to fill
        // it with something. See SISL docs for s1356
        function dummyArray(count){
            var dummy = [];
            for (var i=0; i<count; i++){
                dummy[i] = 1; // 1= ordinary point for interpolation curve
            }
            return dummy;
        }

        // INPUT arguments
        var pointsToInterpolate = Module.Utils.copyJSArrayToC(flattenPointList(pointList)),
            numPts = pointList.length,
            dim = 3, // 3 dimensions, always
            pointTypes = Module.Utils.copyJSArrayToC(dummyArray(pointList.length),'i8'), // each point is an "ordinary point"
            initialCondition = 0, // no initial condition
            endCondition = 0, // no end condition
            open = 0, //periodic === true ? -1 : 1, // -1 = periodic, 1 = open
            order = degree + 1,
            startParam = 0,

        // OUTPUT arguments
            endparam = Module._malloc(16),
            curvePtr = Module._malloc(16*7),
            paramsPtr = Module._malloc(16*numPts),
            numberOfParams = Module._malloc(80);
        console.warn('interpcurves are DRAMATICALLY overallocated, but I dont know how.');

        var arg = [
            pointsToInterpolate,    // double epoint[];
            numPts,                 // int    inbpnt;
            dim,                    // int    idim;
            pointTypes,             // int    nptyp[];
            initialCondition,       // int    icnsta;
            endCondition,           // int    icnend;
            open,                   // int    iopen;
            order,                  // int    ik;
            startParam,             // double astpar;
            endparam,               // double *cendpar;
            curvePtr,               // SISLCurve  **rc;
            paramsPtr,              // double **gpar;
            numberOfParams,         // int    *jnbpar;
            0                       // int    *jstat;
        ];

        s1356.apply(this,arg);
        this.minParam = startParam;
        this.maxParam = Module.getValue(endparam, 'double');

        // store the pointer for later use. s1303 takes a pointer to a pointer, so this._pointer needs to be retrieved
        this._pointer = Module.getValue(curvePtr, 'i8*');
    };

    _.extend(Geo.Curve.prototype,curveMethods);
    _.extend(Geo.CircleCNR.prototype,curveMethods);
    _.extend(Geo.CurveInterpolated.prototype,curveMethods);

    // BASIC TESTING STRATEGY:
    // window.CurveInterp = Geo.CurveInterpolated;
    // var pointList = [new THREE.Vector3(0,0,0),new THREE.Vector3(1,5,0),new THREE.Vector3(5,1,0),new THREE.Vector3(10,0,0)];
    // var curve = CurveInterp(pointList,3,false);
    // (expect no errors in the JS Console)

    return Geo;
});

