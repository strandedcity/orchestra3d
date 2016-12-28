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
            var outputs = this.createIObjectsFromJSON([
                {shortName: "P", type: DataFlow.OUTPUT_TYPES.POINT},
                {shortName: "tA", type: DataFlow.OUTPUT_TYPES.NUMBER, interpretAs: DataFlow.INTERPRET_AS.LIST},
                {shortName: "tB", type: DataFlow.OUTPUT_TYPES.NUMBER, interpretAs: DataFlow.INTERPRET_AS.LIST}
            ], opts, "outputs");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "A", required: true, type: DataFlow.OUTPUT_TYPES.CURVE},
                {shortName: "B", required: true, type: DataFlow.OUTPUT_TYPES.CURVE}
            ], opts, "inputs");

            var args = _.extend({
                componentPrettyName: "CCX",
                preview: true
            },opts || {},{
                inputs: inputs,
                outputs: outputs
            });
            this.base_init(args);
        },
        recalculate: function(){
            /* A = Curve1, B = Curve2 */
            var result = DataMatcher([this.getInput("A"),this.getInput("B")],function(c1,c2){
                // fill multiple output trees with return:
                // {A: "data for tree A", B: "data for tree B"}
                var intersections = Geometry.Intersections.CurveCurve(c1,c2);
                intersections.p = _.map(intersections.t1,function(param){
                    return c1.getPositionAt(param)
                });
                return intersections;
            });

            this.getOutput("P").replaceData(result.tree.map(function(data){return data.p}));
            this.getOutput("tA").replaceData(result.tree.map(function(data){return data.t1}));
            this.getOutput("tB").replaceData(result.tree.map(function(data){return data.t2}));
        },
    },{
        "label": "Curve-Curve Intersection",
        "desc": "Finds intersections between two given curves."
    });


    return components;
});

