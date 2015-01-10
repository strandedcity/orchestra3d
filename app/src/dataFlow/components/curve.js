define([
    "underscore",
    "dataFlow/core",
    "SISL/sisl_loader",
    "dataFlow/UI/geometryPreviews"
],function(_,DataFlow,Geometry,Preview){
    var components = {};
    components.CurveControlPointComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "C", type: DataFlow.OUTPUT_TYPES.CURVE}
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "V", required: true, type: DataFlow.OUTPUT_TYPES.POINT},
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

            var out = this.getOutput("C").getTree();

            // TEMPORARILY -- just use the first value for degree and periodic:
            var degree = this["D"].getFirstValueOrDefault(),
                periodic = this["P"].getFirstValueOrDefault();

            // first attempt at a data-matching strategy. This should match grasshopper's behavior exactly.
            // recurse over point lists ("V"), and for each list encountered, find the closest-matching single value
            this["V"].values.recurseTree(function(pointList,node){
                var curveList = [];

                curveList.push(new Geometry.Curve(pointList,degree,periodic));

                out.setDataAtPath(node.getPath(),curveList);
            });

            this._recalculate();
        },
        drawPreviews: function(){
            var curves = this.getOutput("C").getTree().flattenedTree().dataAtPath([0]);
            _.each(curves,function(c){
                this.previews.push(new Preview.CurvePreview(c));
            },this);
        }
    });

    return components;
});

