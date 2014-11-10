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

                var that = this, shortestInput = this.shortestInputLength();
                if (shortestInput === 0) return;
                for (var i=0; i < shortestInput; i++) {
                    var point = new Geometry.Point(
                        this.inputs[0].values[i],
                        this.inputs[1].values[i],
                        this.inputs[2].values[i]
                    );
                    //console.log(point.getCoords());
        //            console.log('POINTER: ',pointer);
        //            console.log("Has the curve already been allocated? Free it and replace it, or just reuse the memory");
        //            console.log("Allocate a new curve object into memory, execute 'newcurve' function in C using inputs at this index, store pointer in output.values array");
                    that.output.values[i] = point;
                }
                this._recalculate();
                if (this._drawPreview) {
                    this.previews.push(new Preview.PointListPreview(this.output.values));
                }
            },

            fetchPointCoordinates: function(){
                var outputs = this.fetchOutputs(); // returns array of GeoPoints
                var outputVals = [];
                _.each(outputs,function(GeoPoint){
                    outputVals.push(GeoPoint.getCoordsArray());
                });
                return outputVals;
            }
        });

        return DataFlow;
});

