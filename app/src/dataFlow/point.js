define([
        "underscore",
        "dataFlow/core",
        "SISL/sisl_loader"
    ],function(_,DataFlow,Geometry){
        var PointComponent = DataFlow.PointComponent = function PointComponent(opts){
            this.initialize.apply(this, arguments);
        };

        _.extend(PointComponent.prototype, DataFlow.Component.prototype,{
            initialize: function(opts){
                var output = new DataFlow.Output({type: 'GeoPoint'});

                var args = _.extend(opts || {},{
                    inputTypes: {
                        "X": 'number',
                        "Y": 'number',
                        "Z": 'number'
                    },
                    output: output,
                    resultFunction: this.recalculate
                });
                this.base_init(args);
            },
            recalculate: function(){
                var that = this, shortestInput = this.shortestInputLength();
                if (shortestInput === 0) return;
                for (var i=0; i < shortestInput; i++) {
                    var point = new Geometry.Point(
                        this.inputs["X"].values[i],
                        this.inputs["Y"].values[i],
                        this.inputs["Z"].values[i]
                    );
                    //console.log(point.getCoords());
        //            console.log('POINTER: ',pointer);
        //            console.log("Has the curve already been allocated? Free it and replace it, or just reuse the memory");
        //            console.log("Allocate a new curve object into memory, execute 'newcurve' function in C using inputs at this index, store pointer in output.values array");
                    that.output.values[i] = point;
                }
                this._recalculate();
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
