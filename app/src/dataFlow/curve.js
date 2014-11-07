define([
    "underscore",
    "dataFlow/core",
    "SISL/sisl_loader"
],function(_,DataFlow,Geometry){
    var CurveControlPointComponent = DataFlow.CurveControlPointComponent = function CurveControlPointComponent(opts){
        this.initialize.apply(this, arguments);
    };

    _.extend(CurveControlPointComponent.prototype, DataFlow.Component.prototype,{
        initialize: function(opts){
            var output = new DataFlow.OutputCurve();

            var inputs = [
                new DataFlow.OutputPoint({shortName: "V"}),
                new DataFlow.OutputNumber({shortName: "D"}),
                new DataFlow.OutputBoolean({shortName: "P"})
            ];

            var args = _.extend(opts || {},{
                inputs: inputs,
                output: output,
                resultFunction: this.recalculate,
                componentPrettyName: "NURBS Crv"
            });
            this.base_init(args);
        },
        recalculate: function(){
            var that = this, shortestInput = this.shortestInputLength();
            if (shortestInput === 0) return;
            for (var i=0; i < shortestInput; i++) {
                that.output.values[i] = new Geometry.Curve(this.inputs["V"].values[i],this.inputs["D"].values[i],this.inputs["P"].values[i]);
            }
            this._recalculate();
        }
    });

    return DataFlow;
});

