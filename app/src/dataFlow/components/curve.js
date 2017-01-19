define([
    "underscore",
    "dataFlow/core",
    "SISL/sisl_loader",
    "dataFlow/UI/geometryPreviews",
    "dataFlow/dataMatcher"
],function(_,DataFlow,Geometry,Preview,DataMatcher){
    var components = {};

    components.CurveControlPointComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "C", type: DataFlow.OUTPUT_TYPES.CURVE}
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "V", required: true, type: DataFlow.OUTPUT_TYPES.POINT, interpretAs: DataFlow.INTERPRET_AS.LIST, desc: "Control Points"},
                {shortName: "D", required: false, default: 3, type: DataFlow.OUTPUT_TYPES.NUMBER, desc: "Curve Degree"},
                {shortName: "P", required: false, default: false, type: DataFlow.OUTPUT_TYPES.BOOLEAN, desc: "Periodic"}
            ], opts, "inputs");

            var args = _.extend({
                componentPrettyName: "NURBS Crv",
                preview: true
            },opts || {},{
                inputs: inputs,
                outputs: output
            });
            this.base_init(args);
        },
        recalculate: function(pointList,degree,periodic){
            console.warn("PERIODIC input is ignored!");
            return {C: new Geometry.Curve().fromControlPointsDegreeKnots(pointList,degree)};
        }
    },{
        "label": "NURBS Curve",
        "desc": "Generates a new Curve object based on a list of control points"
    });

    // Line Connecting Two Points
    components.LineABComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "L", type: DataFlow.OUTPUT_TYPES.CURVE}
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "A", required: true, type: DataFlow.OUTPUT_TYPES.POINT, desc: "Start Point"},
                {shortName: "B", required: true, type: DataFlow.OUTPUT_TYPES.POINT, desc: "End Point"}
            ], opts, "inputs");

            var args = _.extend({
                componentPrettyName: "Line",
                preview: true
            },opts || {},{
                inputs: inputs,
                outputs: output
            });
            this.base_init(args);
        },
        recalculate: function(p1,p2){
            return {L: new Geometry.Curve().fromControlPointsDegreeKnots([p1,p2],1)};
        }
    },{
        "label": "Line (A,B)",
        "desc": "Creates a line connecting two points"
    });

    // Line: Start (point), Direction (vec), Length (num)
    components.LineSDLComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "L", type: DataFlow.OUTPUT_TYPES.CURVE}
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "S", required: true, type: DataFlow.OUTPUT_TYPES.POINT, desc: "Start Point"},
                {shortName: "D", required: true, type: DataFlow.OUTPUT_TYPES.POINT, desc: "Direction Vector"},
                {shortName: "L", required: true, type: DataFlow.OUTPUT_TYPES.NUMBER, desc: "Length"}
            ], opts, "inputs");

            var args = _.extend({
                componentPrettyName: "Line SDL",
                preview: true
            },opts || {},{
                inputs: inputs,
                outputs: output
            });
            this.base_init(args);
        },
        recalculate: function(start,direction,length){
            return {L: new Geometry.Curve().fromControlPointsDegreeKnots([
                            start.clone(),
                            start.clone().addScaledVector(direction.clone().normalize(),
                            length)
                        ],1)};
        }
    },{
        "label": "Line (Start, Direction, Length)",
        "desc": "Creates a line from it's start point, direction vector, and length"
    });

    components.EvaluateCurveComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var outputs = this.createIObjectsFromJSON([
                {shortName: "P", type: DataFlow.OUTPUT_TYPES.POINT, desc: "Position at parameter t"}, // position @ t
                {shortName: "T", type: DataFlow.OUTPUT_TYPES.POINT, desc: "Tangent vector at t"}, // tangent vect @ t
                {shortName: "A", type: DataFlow.OUTPUT_TYPES.NUMBER, desc: "Angle between incoming and outgoing vectors at t"} // angle between incoming and outgoing vects @ t, in radians
            ], opts, "outputs");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "C", required: true, type: DataFlow.OUTPUT_TYPES.CURVE, desc: "Curve to evaluate"},  // Curve to evaluate
                {shortName: "t", required: false, default: 0, type: DataFlow.OUTPUT_TYPES.NUMBER, desc: "Parameter to evaluate"} // parameter to evaluate
            ], opts, "inputs");

            var args = _.extend({
                componentPrettyName: "Eval Crv",
                preview: false
            },opts || {},{
                inputs: inputs,
                outputs: outputs
            });
            this.base_init(args);
        },
        recalculate: function(curve,parameter){
            console.warn("ANGLE output not supported");
            var evaluation = curve._evalAt(parameter);

            return {
                P: new THREE.Vector3(evaluation[0],evaluation[1],evaluation[2]),
                T: new THREE.Vector3(evaluation[3],evaluation[4],evaluation[5]),
                A: 1
            }
        }
    },{
        "label": "Evaluate Curve at Parameter",
        "desc": "Given an input curve 'C' and parameter 't', find the position and tangent at that parameter"
    });

    components.DivideCurveComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "P", type: DataFlow.OUTPUT_TYPES.POINT, interpretAs: DataFlow.INTERPRET_AS.LIST, desc: "Division points"}, // Division Points
                {shortName: "T", type: DataFlow.OUTPUT_TYPES.POINT, interpretAs: DataFlow.INTERPRET_AS.LIST, desc: "Tangents at division points"}, // Tangents at Division Points
                {shortName: "t", type: DataFlow.OUTPUT_TYPES.NUMBER, interpretAs: DataFlow.INTERPRET_AS.LIST, desc: "Parameter values"} // Parameter Values
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "C", required: true, type: DataFlow.OUTPUT_TYPES.CURVE, desc: "Curve to divide"},
                {shortName: "N", required: false, default: 10, type: DataFlow.OUTPUT_TYPES.NUMBER, desc: "Number of segments"},
                {shortName: "K", required: false, default: false, type: DataFlow.OUTPUT_TYPES.BOOLEAN, desc: "Split at kinks"} // default worldXY
                //{shortName: "C", required: false, default: false, type: DataFlow.OUTPUT_TYPES.BOOLEAN}, // corner type flag ?
            ], opts, "inputs");

            var args = _.extend({
                componentPrettyName: "Divide",
                preview: true
            },opts || {},{
                inputs: inputs,
                outputs: output
            });
            this.base_init(args);
        },
        recalculate: function(curve, segmentCount, divideAtKnots){
            var steps = curve.divideEqualLengthSegments(segmentCount), // parameter values at division points
                positions = [],
                tangents = [];
            _.each(steps,function(paramValue){
                var evaluation = curve._evalAt(paramValue);
                positions.push(new Geometry.Point(evaluation[0],evaluation[1],evaluation[2]));
                tangents.push(new Geometry.Point(evaluation[3],evaluation[4],evaluation[5]));
            });

            console.warn("'KINKS' OPTION NOT SUPPORTED YET");
            return {
                P: positions,
                T: tangents,
                t: steps
            }
        }
    },{
        "label": "Divide Curve",
        "desc": "Divides a curve into N segments"
    });

    components.CurveOffsetComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "C", type: DataFlow.OUTPUT_TYPES.CURVE, desc: "Offset curve"}
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "C", required: true, type: DataFlow.OUTPUT_TYPES.CURVE, desc: "Curve to offset"},
                {shortName: "D", required: false, default: 1, type: DataFlow.OUTPUT_TYPES.NUMBER, desc: "Distance to offset by"},
                {shortName: "P", required: false, default: false, type: DataFlow.OUTPUT_TYPES.PLANE, desc: "Plane for offset operation"} // default worldXY
                //{shortName: "C", required: false, default: false, type: DataFlow.OUTPUT_TYPES.BOOLEAN}, // corner type flag ?
            ], opts, "inputs");

            var args = _.extend({
                componentPrettyName: "Offset",
                preview: true
            },opts || {},{
                inputs: inputs,
                outputs: output
            });
            this.base_init(args);
        },
        recalculate: function(curve, distance, plane){
            //var normalVect = plane.getNormal();
            console.warn("NEED TO DEFINE PLANE OBJECT WITH .getNormal() method");
            return {C: new Geometry.CurveOffset(curve,distance,new THREE.Vector3(0,1,0))};
        }
    },{
        "label": "Offset Curve",
        "desc": "Offsets a curve with a specified distance"
    });

    components.CurveInterpolatedComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "C", type: DataFlow.OUTPUT_TYPES.CURVE, desc: "Interpolated curve"}
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "V", required: true, type: DataFlow.OUTPUT_TYPES.POINT, interpretAs: DataFlow.INTERPRET_AS.LIST, desc: "Points to interpolate"},
                {shortName: "D", required: false, default: 3, type: DataFlow.OUTPUT_TYPES.NUMBER, desc: "Degree of output curve"},
                {shortName: "P", required: false, default: false, type: DataFlow.OUTPUT_TYPES.BOOLEAN, desc: "Periodic"}
            ], opts, "inputs");

            var args = _.extend({
                componentPrettyName: "Interpolate",
                preview: true
            },opts || {},{
                inputs: inputs,
                outputs: output
            });
            this.base_init(args);
        },
        recalculate: function(pointList,degree,periodic){
            return {C: new Geometry.CurveInterpolated(pointList,degree,periodic)};
        }
    },{
        "label": "Interpolated Curve",
        "desc": "Generates a new Curve object that will pass through each point in a supplied list of points. Parametricization is automatic."
    });



    components.CurvePolyLine = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "Pl", type: DataFlow.OUTPUT_TYPES.CURVE, desc: "Resulting polyline"}
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "V", required: true, type: DataFlow.OUTPUT_TYPES.POINT, interpretAs: DataFlow.INTERPRET_AS.LIST, desc: "Polyline vertices"}, // Points for polyline, as list
                {shortName: "C", required: false, default: false, type: DataFlow.OUTPUT_TYPES.BOOLEAN, desc: "Closed"} // Closed?
            ], opts, "inputs");

            var args = _.extend({
                componentPrettyName: "PLine",
                preview: true
            },opts || {},{
                inputs: inputs,
                outputs: output
            });
            this.base_init(args);
        },
        recalculate: function(pointList,closed){
            var pts = pointList;
            if (closed) {
                // push first point onto end of point list as well
                pts = pointList.slice(0);
                pts.push(pointList[0]);
            }
            return {Pl: new Geometry.Curve().fromControlPointsDegreeKnots(pts,1)}; // knots will be generated automatically if parameterization is not supplied
        }
    },{
        "label": "PolyLine (Pline)",
        "desc": "Create a polyline connecting a number of points"
    });


    components.Rectangle3Pt = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "R", type: DataFlow.OUTPUT_TYPES.CURVE, desc: "Rectangle defined by A, B and C"},
                {shortName: "L", type: DataFlow.OUTPUT_TYPES.NUMBER, desc: "Length of rectangle curve"}
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "A", required: true, type: DataFlow.OUTPUT_TYPES.POINT, desc: "First corner of rectangle"}, 
                {shortName: "B", required: true, type: DataFlow.OUTPUT_TYPES.POINT, desc: "Second corner of rectangle"}, 
                {shortName: "C", required: true, type: DataFlow.OUTPUT_TYPES.POINT, desc: "Point along rectangle edge opposite to AB"}
            ], opts, "inputs");

            var args = _.extend({
                componentPrettyName: "Rec 3Pt",
                preview: true
            },opts || {},{
                inputs: inputs,
                outputs: output
            });
            this.base_init(args);
        },
        recalculate: function(p1,p2,p3){
            // Construct 
            // We have points A & B supplied by the user; we need to find C & D, which are just A&B translated orthogonally
            // Project p3 onto the line connecting p1=>p2, then connect p3 with its projection.
            // use .projectOnVector()
            // 1) Subtract p1 from p2 and p3 (so we're working at the origin)
            // 2) project p3 onto p2
            // 3) Construct the "edge" vector, connecting this projection to p3
            // 4) Add "edge" vector to original A & B to get C & D

            var points = [p1,p2];

            var originP2 = p2.clone().sub(p1),
                originP3 = p3.clone().sub(p1);

            var edge = originP3.clone().sub(originP3.projectOnVector(originP2));

            points.push(p2.clone().add(edge));
            points.push(p1.clone().add(edge));
            points.push(p1); // close the curve

            var rect = new Geometry.Curve().fromControlPointsDegreeKnots(points,1);
            return {
                R: rect,
                L: rect.getLength()
            }
        }
    },{
        "label": "Rectangle 3Pt",
        "desc": "Create a rectangle from three points"
    });

    components.CurveEndPoints = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "S", type: DataFlow.OUTPUT_TYPES.POINT, desc: "Point at curve start"},
                {shortName: "E", type: DataFlow.OUTPUT_TYPES.POINT, desc: "Point at curve end"}
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "C", required: true, type: DataFlow.OUTPUT_TYPES.CURVE, desc: "Curve"}
            ], opts, "inputs");

            var args = _.extend({
                componentPrettyName: "End",
                preview: true
            },opts || {},{
                inputs: inputs,
                outputs: output
            });
            this.base_init(args);
        },
        recalculate: function(curve){
            return {
                S: curve.getStartPoint(),
                E: curve.getEndPoint()
            }
        },
        getPreviewOutputs: function(){
            // Special preview, because both outputs are previewable (not just the first one)
            return [this.getOutput("S"),this.getOutput("E")];
        },
    },{
        "label": "End Points",
        "desc": "Extract the end points of a curve"
    });

    
    components.ExtractControlPoints = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "P", type: DataFlow.OUTPUT_TYPES.POINT, interpretAs: DataFlow.INTERPRET_AS.LIST, desc: "Control points"},
                {shortName: "W", type: DataFlow.OUTPUT_TYPES.POINT, interpretAs: DataFlow.INTERPRET_AS.LIST, desc: "Weights of controls points"},
                {shortName: "K", type: DataFlow.OUTPUT_TYPES.POINT, interpretAs: DataFlow.INTERPRET_AS.LIST, desc: "Knot vector of this NURBS curve"}
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "C", required: true, type: DataFlow.OUTPUT_TYPES.CURVE, desc: "Curve"}
            ], opts, "inputs");

            var args = _.extend({
                componentPrettyName: "CP",
                preview: true
            },opts || {},{
                inputs: inputs,
                outputs: output
            });
            this.base_init(args);
        },
        recalculate: function(curve){
            var points = curve.getControlPoints();
            console.warn("WEIGHTS not supported. To support it, we must retrieve rcoef from the SISLCurve Definition. See SISL Docs.")
            // See SISL docs page 127, section 5.1
            // rcoef:  Pointer to the array of rational vertices and weights, size in (idim + 1).
            return {
                P: points,
                W: _.map(points,function(p){return null;}),
                K: curve.getKnotVector
            }
        }
    },{
        "label": "Extract Control Points",
        "desc": "Extract the NURBS control points and knots of a curve"
    });

    

    return components;
});

