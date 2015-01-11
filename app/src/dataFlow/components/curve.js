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

            var args = _.extend(opts || {},{
                inputs: inputs,
                output: output,
                componentPrettyName: "NURBS Crv",
                preview: true
            });
            this.base_init(args);
        },
        recalculate: function(){
            this.getOutput("C").clearValues();

            /* D = degree, P = periodic, V = points (AS LIST) */
            var result = DataMatcher([this.getInput("D"),this.getInput("P"),this.getInput("V")],function(degree,periodic,pointList){
                return new Geometry.Curve(pointList,degree,periodic)
            });

            this.getOutput("C").replaceData(result.tree);
            this._recalculate();
        },
        drawPreviews: function(){
            var curves = this.getOutput("C").getTree().flattenedTree().dataAtPath([0]);
            _.each(curves,function(c){
                this.previews.push(new Preview.CurvePreview(c));
            },this);
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

            var args = _.extend(opts || {},{
                inputs: inputs,
                outputs: outputs,
                componentPrettyName: "Eval Crv",
                preview: false
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

            this._recalculate();
        },
        drawPreviews: function(){
            var points = [];

            // Using flattenedTree() here causes something odd to happen... Not worth bugfixing right now.
            this.getOutput("P").getTree().recurseTree(function(data){
                points.push(data);
            });
            this.previews.push(new Preview.PointListPreview(points));
        }
    });



    return components;
});

