define([
    "underscore",
    "dataFlow/core",
    "SISL/sisl_loader",
    "dataFlow/UI/geometryPreviews"
],function(_,DataFlow,Geometry,Preview){
    // Circle(center,normal,radius)

    var CircleCNR = DataFlow.CircleCNR = function CircleCNR(opts){
        this.initialize.apply(this, arguments);
    };

    _.extend(CircleCNR.prototype, DataFlow.Component.prototype,{
        initialize: function(opts){
            var output = new DataFlow.OutputCurve();

            var inputs = [
                new DataFlow.OutputPoint({shortName: "C"}),
                new DataFlow.OutputPoint({shortName: "N"}),
                new DataFlow.OutputNumber({shortName: "R"})
            ];

            var args = _.extend(opts || {},{
                inputs: inputs,
                output: output,
                resultFunction: this.recalculate,
                componentPrettyName: "Circle",
                drawPreview: true
            });
            this.base_init(args);
        },
        recalculate: function(){
            this.output.clearValues();

            var that = this;


//                out = that.output.values;
//
//            // TEMPORARILY -- just use the first value for degree and periodic:
//            var degree = this["D"].values.dataAtPath([0])[0],
//                periodic = this["P"].values.dataAtPath([0])[0];
//
//            // first attempt at a data-matching strategy. This should match grasshopper's behavior exactly.
//            // recurse over point lists ("V"), and for each list encountered, find the closest-matching single value
//            this["V"].values.recurseTree(function(pointList,node){
//                var curveList = [];
//
//                curveList.push(new Geometry.Curve(pointList,degree,periodic));
//
//                out.setDataAtPath(node.getPath(),curveList);
//            });
//
//            this._recalculate();
//
//            if (this._drawPreview) {
//                var curves = out.flattenedTree().dataAtPath([0]);
//                _.each(curves,function(c){
//                    this.previews.push(new Preview.CurvePreview(c));
//                },this);
//            }
        }
    });

    return DataFlow;
});
