define([
    "underscore",
    "dataFlow/core",
    "SISL/sisl_loader",
    "dataFlow/UI/geometryPreviews",
    "dataFlow/dataMatcher"
],function(_,DataFlow,Geometry,Preview,DataMatcher){
    var components = {};

    // CCX component
    // IN: A, B (curves)
    // OUT: P (points), tA (parameters on curve A AS_LIST), tB (parameters on curve B AS_LIST)
    components.CurveCurveIntersectionComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "P", type: DataFlow.OUTPUT_TYPES.POINT},
                {shortName: "tA", type: DataFlow.OUTPUT_TYPES.NUMBER, interpretAs: DataFlow.INTERPRET_AS.LIST},
                {shortName: "tB", type: DataFlow.OUTPUT_TYPES.NUMBER, interpretAs: DataFlow.INTERPRET_AS.LIST}
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "A", required: true, type: DataFlow.OUTPUT_TYPES.CURVE},
                {shortName: "B", required: true, type: DataFlow.OUTPUT_TYPES.CURVE}
            ], opts, "inputs");

            var args = _.extend({
                componentPrettyName: "CCX",
                preview: true
            },opts || {},{
                inputs: inputs,
                output: output
            });
            this.base_init(args);
        },
        recalculate: function(){
            /* A = Curve1, B = Curve2 */
            var result = DataMatcher([this.getInput("A"),this.getInput("B")],function(c1,c2){
                // fill multiple output trees with return:
                // {A: "data for tree A", B: "data for tree B"}
                var intersections = Geometry.Intersections.CurveCurve(c1,c2);

console.log(intersections);
                return intersections;
            });

            // each intersetion will contain two pieces of data, and we need to extract a third:
            //{
            //    curve1Parameters: tA,
            //        curve2Parameters: tB
            //}

            //// For each intersection point, calculate the point in world xyz
            //// (sisl outputs the point in terms of parameters on the first curve)
            //var intersectionPointsXYZ = _.map(tA,function(param){
            //    return curve1.getPositionAt(param);
            //});

            this.getOutput("C").replaceData(result.tree);
        },
        drawPreviews: function(){
            // TODO! Preview the intersection points.
        }
    });


    return components;
});

