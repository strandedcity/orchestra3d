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
            //var output = new DataFlow.OutputCurve();

            //var inputs = [
            //    new DataFlow.OutputPoint({shortName: "V"}),
            //    new DataFlow.OutputNumber({shortName: "D"}),
            //    new DataFlow.OutputBoolean({shortName: "P"})
            //];
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
            this.output.clearValues();

            var that = this,
                out = that.output.values;

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
            var curves = this.output.values.flattenedTree().dataAtPath([0]);
            _.each(curves,function(c){
                this.previews.push(new Preview.CurvePreview(c));
            },this);
        }
    });

    return components;
});

