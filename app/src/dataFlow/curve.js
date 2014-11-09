define([
    "underscore",
    "dataFlow/core",
    "SISL/sisl_loader",
    "dataFlow/UI/geometryPreviews"
],function(_,DataFlow,Geometry,Preview){
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
            //for (var i=0; i < shortestInput; i++) {
            //    that.output.values[i] = new Geometry.Curve(this["V"].values[i],this["D"].values[i],this["P"].values[i]);
            //}

            // destroy prior views
            _.each(this.previews,function(prev){
                prev.remove();
            });
            this.previews.splice(0,this.previews.length); // make sure the previews can be deallocated. remove references.
            
            this.output.values = [new Geometry.Curve(this["V"].values,this["D"].values[0],this["P"].values[0])];
            this._recalculate();

            console.log(this.output.values[0]);
            this.previews.push(new Preview.CurvePreview(this.output.values[0]));
        }
    });

    return DataFlow;
});

