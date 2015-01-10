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

    return components;
});

