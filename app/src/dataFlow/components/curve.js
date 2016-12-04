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
                output: output
            });
            this.base_init(args);
        },
        recalculate: function(){
            /* D = degree, P = periodic, V = points (AS LIST) */
            var result = DataMatcher([this.getInput("D"),this.getInput("P"),this.getInput("V")],function(degree,periodic,pointList){
                return new Geometry.Curve(pointList,degree,periodic)
            });

            this.getOutput("C").replaceData(result.tree);
        },
        drawPreviews: function(){
            var curves = this.getOutput("C").getTree().flattenedTree().dataAtPath([0]);

            var preview;
            if (_.isArray(this.previews) && this.previews.length > 0) {
                preview = this.previews[0];

                // update the preview geometry
                preview.updateCurveList(curves);
                preview.show();
            }
            else {
                preview = new Preview.CurveListPreview(curves);
                this.previews = [preview];
            }
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
            this.getOutput("P").clearValues();
            this.getOutput("T").clearValues();
            this.getOutput("A").clearValues();

            /* C = curve, t = param, P = result point, T = result tangent, A = result angle between left & right tangents */
            // Multi-output DataMatcher works with:
            // 1) Array of input models
            // 2) Calc function that returns an object of return values for each aligned entry
            // 3) A matching object of output trees to fill
            DataMatcher(
                [
                    this.getInput("C"),
                    this.getInput("t")
                ],
                function(curve,parameter){
                    var evaluation = curve._evalAt(parameter);

                    return {
                        P: new THREE.Vector3(evaluation[0],evaluation[1],evaluation[2]),
                        T: new THREE.Vector3(evaluation[3],evaluation[4],evaluation[5]),
                        A: 1
                    }
                },
                {
                    P: this.getOutput("P").getTree(),
                    T: this.getOutput("T").getTree(),
                    A: this.getOutput("A").getTree()
                }
            );
        },
        drawPreviews: function(){
            var points = [];

            // Using flattenedTree() here causes something odd to happen... Not worth bugfixing right now.
            this.getOutput("P").getTree().recurseTree(function(data){
                points = points.concat(data);
            });

            if (_.isArray(this.previews) && !_.isUndefined(this.previews[0])) {
                this.previews[0].updatePoints(points);
            } else {
                this.previews = [new Preview.PointListPreview(points)];
            }
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
                output: output
            });
            this.base_init(args);
        },
        recalculate: function(){
            console.log('recalculating offsetcurve');

            /* C = Curve, D = Distance, P = Plane */
            var result = DataMatcher([this.getInput("D"),this.getInput("P"),this.getInput("V")],function(curve, distance, plane){
                //var normalVect = plane.getNormal();
                console.warn("NEED TO DEFINE PLANE OBJECT WITH .getNormal() method");
                return new Geometry.CurveOffset(curve,distance,plane);
            });

            this.getOutput("C").replaceData(result.tree);
        },
        drawPreviews: function(){
            var curves = this.getOutput("C").getTree().flattenedTree().dataAtPath([0]);

            var preview;
            if (_.isArray(this.previews) && this.previews.length > 0) {
                preview = this.previews[0];

                // update the preview geometry
                preview.updateCurveList(curves);
                preview.show();
            }
            else {
                preview = new Preview.CurveListPreview(curves);
                this.previews = [preview];
            }
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
                output: output
            });
            this.base_init(args);
        },
        recalculate: function(){
            console.log('recalculating interpcrv');
            //this.getOutput("C").getTree().recurseTree(function(data){
            //    _.each(data,function(interpcrv){
            //        interpcrv.destroy();
            //    });
            //});

            /* D = degree, P = periodic, V = points (AS LIST) */
            var result = DataMatcher([this.getInput("D"),this.getInput("P"),this.getInput("V")],function(degree,periodic,pointList){
                return new Geometry.CurveInterpolated(pointList,degree,periodic);
            });

            this.getOutput("C").replaceData(result.tree);
        },
        drawPreviews: function(){
            var curves = this.getOutput("C").getTree().flattenedTree().dataAtPath([0]);

            var preview;
            if (_.isArray(this.previews) && this.previews.length > 0) {
                preview = this.previews[0];

                // update the preview geometry
                preview.updateCurveList(curves);
                preview.show();
            }
            else {
                preview = new Preview.CurveListPreview(curves);
                this.previews = [preview];
            }
        }
    });


    return components;
});

