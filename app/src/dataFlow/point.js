define([
        "underscore",
        "dataFlow/core",
        "SISL/sisl_loader",
        "dataFlow/UI/geometryPreviews"
    ],function(_,DataFlow,Geometry,Preview){
        var PointComponent = DataFlow.PointComponent = function PointComponent(opts){
            this.initialize.apply(this, arguments);
        };

        _.extend(PointComponent.prototype, DataFlow.Component.prototype,{
            initialize: function(opts){
                var output = new DataFlow.OutputPoint();

                var inputs = [
                    new DataFlow.OutputNumber({shortName: "X"}),
                    new DataFlow.OutputNumber({shortName: "Y"}),
                    new DataFlow.OutputNumber({shortName: "Z"})
                ];

                var args = _.extend(opts || {},{
                    inputs: inputs,
                    output: output,
                    resultFunction: this.recalculate,
                    componentPrettyName: "Point(x,y,z)",
                    drawPreview: false
                });
                this.base_init(args);
            },
            recalculate: function(){
                this.clearPreviews();
                this.output.clearValues();

                var that = this,
                    out = that.output.values,
                    nullOutputs = true;

                this["X"].values.recurseTree(function(xvals,node){
                    var pointList = [],
                        p = node.getPath();

                    _.each(xvals,function(val,idx){
                        var y = that["Y"].getTree().dataAtPath(p)[idx],
                            z = that["Z"].getTree().dataAtPath(p)[idx];
                        pointList[idx] = new Geometry.Point(val,y,z);
                    });

                    if (pointList.length > 0) nullOutputs = false; // set null to false!
                    out.setDataAtPath(p,pointList);
                });

                this.output.setNull(nullOutputs);
                this._recalculate();

                if (this._drawPreview) {
                    this.previews.push(new Preview.PointListPreview(this.output.values));
                }
            },

            fetchPointCoordinates: function(){
                /* THIS FUNCTION IS STUPID. It's handy for writing tests, maybe, but it doesn't deal with the data trees in any useful way. */
                var outputs = this.output.getTree().flattenedTree().dataAtPath([0]);
                var outputVals = [];  // returns array of GeoPoints
                _.each(outputs,function(GeoPoint){
                    outputVals.push(GeoPoint.getCoordsArray());
                });
                return outputVals;
            }
        });

        return DataFlow;
});

