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
                {shortName: "P", type: DataFlow.OUTPUT_TYPES.POINT, interpretAs: DataFlow.INTERPRET_AS.LIST, desc: "Intersection points"},
                {shortName: "tA", type: DataFlow.OUTPUT_TYPES.NUMBER, interpretAs: DataFlow.INTERPRET_AS.LIST, desc: "Parameter values on first curve"},
                {shortName: "tB", type: DataFlow.OUTPUT_TYPES.NUMBER, interpretAs: DataFlow.INTERPRET_AS.LIST, desc: "Parameter values on second curve"}
            ], opts, "outputs");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "A", required: true, type: DataFlow.OUTPUT_TYPES.CURVE, desc: "First curve"},
                {shortName: "B", required: true, type: DataFlow.OUTPUT_TYPES.CURVE, desc: "Second curve"}
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
        recalculate: function(c1,c2){
            // fill multiple output trees with return:
            // {A: "data for tree A", B: "data for tree B"}
            var intersections = Geometry.Intersections.CurveCurve(c1,c2);
            intersections.p = _.map(intersections.t1,function(param){
                return c1.getPositionAt(param)
            });
            return {
                P: intersections.p,
                tA: intersections.t1,
                tB: intersections.t2
            };
        }
    },{
        "label": "Curve-Curve Intersection",
        "desc": "Finds intersections between two given curves."
    });


    return components;
});

