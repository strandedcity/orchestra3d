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
                {shortName: "V", required: true, type: DataFlow.OUTPUT_TYPES.POINT, interpretAs: DataFlow.INTERPRET_AS.LIST},
                {shortName: "D", required: false, default: 3, type: DataFlow.OUTPUT_TYPES.NUMBER},
                {shortName: "P", required: false, default: false, type: DataFlow.OUTPUT_TYPES.BOOLEAN}
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
        recalculate: function(){
            /* D = degree, P = periodic, V = points (AS LIST) */
            console.warn("PERIODIC input is ignored!");
            var result = DataMatcher([this.getInput("D"),this.getInput("P"),this.getInput("V")],function(degree,periodic,pointList){
                return new Geometry.Curve().fromControlPointsDegreeKnots(pointList,degree)
            });

            this.getOutput("C").replaceData(result.tree);
        }
    });

    // Line Connecting Two Points
    components.LineABComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "L", type: DataFlow.OUTPUT_TYPES.CURVE}
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "A", required: true, type: DataFlow.OUTPUT_TYPES.POINT},
                {shortName: "B", required: true, type: DataFlow.OUTPUT_TYPES.POINT}
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
        recalculate: function(){
            /* A = Point 1, B = Point2 */
            var result = DataMatcher([this.getInput("A"),this.getInput("B")],function(p1,p2){
                return new Geometry.Curve().fromControlPointsDegreeKnots([p1,p2],1);
            });

            this.getOutput("L").replaceData(result.tree);
        }
    });

    // Line: Start (point), Direction (vec), Length (num)
    components.LineSDLComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "L", type: DataFlow.OUTPUT_TYPES.CURVE}
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "S", required: true, type: DataFlow.OUTPUT_TYPES.POINT},
                {shortName: "D", required: true, type: DataFlow.OUTPUT_TYPES.POINT},
                {shortName: "L", required: true, type: DataFlow.OUTPUT_TYPES.NUMBER}
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
        recalculate: function(){
            /* S = Start, D = Direction, L = Length */
            var result = DataMatcher([this.getInput("S"),this.getInput("D"),this.getInput("L")],function(start,direction,length){
                return new Geometry.Curve()
                    .fromControlPointsDegreeKnots([start.clone(),start.clone().addScaledVector(direction.clone().normalize(),length)],1);
            });

            this.getOutput("L").replaceData(result.tree);
        }
    });

    components.EvaluateCurveComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var outputs = this.createIObjectsFromJSON([
                {shortName: "P", type: DataFlow.OUTPUT_TYPES.POINT}, // position @ t
                {shortName: "T", type: DataFlow.OUTPUT_TYPES.POINT}, // tangent vect @ t
                {shortName: "A", type: DataFlow.OUTPUT_TYPES.NUMBER} // angle between incoming and outgoing vects @ t, in radians
            ], opts, "outputs");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "C", required: true, type: DataFlow.OUTPUT_TYPES.CURVE},  // Curve to evaluate
                {shortName: "t", required: false, default: 0, type: DataFlow.OUTPUT_TYPES.NUMBER} // parameter to evaluate
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
        recalculate: function(){
            /* C = Curve, t = Parameter */
            var result = DataMatcher([this.getInput("C"),this.getInput("t")],function(curve,parameter){
                var evaluation = curve._evalAt(parameter);

                return {
                    P: new THREE.Vector3(evaluation[0],evaluation[1],evaluation[2]),
                    T: new THREE.Vector3(evaluation[3],evaluation[4],evaluation[5]),
                    A: 1
                }
            });

            this.getOutput("P").replaceData(result.tree.map(function(data){return data.P}));
            this.getOutput("T").replaceData(result.tree.map(function(data){return data.T}));
            this.getOutput("A").replaceData(result.tree.map(function(data){return data.A}));
        }
    });

    components.DivideCurveComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "P", type: DataFlow.OUTPUT_TYPES.POINT, interpretAs: DataFlow.INTERPRET_AS.LIST}, // Division Points
                {shortName: "T", type: DataFlow.OUTPUT_TYPES.POINT, interpretAs: DataFlow.INTERPRET_AS.LIST}, // Tangents at Division Points
                {shortName: "t", type: DataFlow.OUTPUT_TYPES.NUMBER, interpretAs: DataFlow.INTERPRET_AS.LIST} // Parameter Values
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "C", required: true, type: DataFlow.OUTPUT_TYPES.CURVE},
                {shortName: "N", required: false, default: 10, type: DataFlow.OUTPUT_TYPES.NUMBER},
                {shortName: "K", required: false, default: false, type: DataFlow.OUTPUT_TYPES.BOOLEAN} // default worldXY
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
        recalculate: function(){
            /* C = Curve, N = # of segments, K = Split at knots */
            var result = DataMatcher([this.getInput("C"),this.getInput("N"),this.getInput("K")],function(curve, segmentCount, divideAtKnots){
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
            });

            this.getOutput("P").replaceData(result.tree.map(function(data){return data.P}));
            this.getOutput("T").replaceData(result.tree.map(function(data){return data.T}));
            this.getOutput("t").replaceData(result.tree.map(function(data){return data.t}));
        }
    });

    components.CurveOffsetComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "C", type: DataFlow.OUTPUT_TYPES.CURVE}
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "C", required: true, type: DataFlow.OUTPUT_TYPES.CURVE},
                {shortName: "D", required: false, default: 1, type: DataFlow.OUTPUT_TYPES.NUMBER},
                {shortName: "P", required: false, default: false, type: DataFlow.OUTPUT_TYPES.PLANE} // default worldXY
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
        recalculate: function(){
            /* C = Curve, D = Distance, P = Plane */
            var result = DataMatcher([this.getInput("C"),this.getInput("D"),this.getInput("P")],function(curve, distance, plane){
                //var normalVect = plane.getNormal();
                console.warn("NEED TO DEFINE PLANE OBJECT WITH .getNormal() method");
                return new Geometry.CurveOffset(curve,distance,new THREE.Vector3(0,1,0));
            });

            this.getOutput("C").replaceData(result.tree);
        }
    });

    components.CurveInterpolatedComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "C", type: DataFlow.OUTPUT_TYPES.CURVE}
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "V", required: true, type: DataFlow.OUTPUT_TYPES.POINT, interpretAs: DataFlow.INTERPRET_AS.LIST},
                {shortName: "D", required: false, default: 3, type: DataFlow.OUTPUT_TYPES.NUMBER},
                {shortName: "P", required: false, default: false, type: DataFlow.OUTPUT_TYPES.BOOLEAN}
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
        recalculate: function(){
            console.log('recalculating interpcrv');

            /* D = degree, P = periodic, V = points (AS LIST) */
            var result = DataMatcher([this.getInput("D"),this.getInput("P"),this.getInput("V")],function(degree,periodic,pointList){
                return new Geometry.CurveInterpolated(pointList,degree,periodic);
            });

            this.getOutput("C").replaceData(result.tree);
        }
    });



    components.CurvePolyLine = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "Pl", type: DataFlow.OUTPUT_TYPES.CURVE}
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "V", required: true, type: DataFlow.OUTPUT_TYPES.POINT, interpretAs: DataFlow.INTERPRET_AS.LIST},
                {shortName: "C", required: false, default: false, type: DataFlow.OUTPUT_TYPES.BOOLEAN}
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
        recalculate: function(){
            /* V = Point List (AS LIST), C = Closed */
            var result = DataMatcher([this.getInput("V"),this.getInput("C")],function(pointList,closed){
                return new Geometry.Curve().fromControlPointsDegreeKnots(pointList,1); // knots will be generated automatically if parameterization is not supplied
            });

            this.getOutput("Pl").replaceData(result.tree);
        }
    });



    components.CurveEndPoints = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "S", type: DataFlow.OUTPUT_TYPES.POINT},
                {shortName: "E", type: DataFlow.OUTPUT_TYPES.POINT}
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "C", required: true, type: DataFlow.OUTPUT_TYPES.CURVE}
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
        recalculate: function(){
            /* C = Curve */
            var result = DataMatcher([this.getInput("C")],function(curve){
                return {
                    S: curve.getStartPoint(),
                    E: curve.getEndPoint()
                }
            });

            this.getOutput("S").replaceData(result.tree.map(function(data){return data.S}));
            this.getOutput("E").replaceData(result.tree.map(function(data){return data.E}));
        },
        getPreviewOutputs: function(){
            // Special preview, because both outputs are previewable (not just the first one)
            return [this.getOutput("S"),this.getOutput("E")];
        },
    });


    return components;
});

