define([
    "underscore",
    "dataFlow/core",
    "SISL/sisl_loader",
    "dataFlow/UI/geometryPreviews",
    "dataFlow/dataMatcher"
],function(_,DataFlow,Geometry,Preview,DataMatcher){
    var CircleCNRComponent = DataFlow.CircleCNRComponent = function CircleCNRComponent(opts){
        this.initialize.apply(this, arguments);
    };

    _.extend(CircleCNRComponent.prototype, DataFlow.Component.prototype,{
        initialize: function(opts){
            var output = new DataFlow.OutputCurve();

            var inputs = [
                new DataFlow.OutputPoint({shortName: "C", required: false, default: new THREE.Vector3(0,0,0)}),
                new DataFlow.OutputPoint({shortName: "N", required: false, default: new THREE.Vector3(0,0,1)}),
                new DataFlow.OutputNumber({shortName: "R", required: true})
            ];

            var args = _.extend(opts || {},{
                inputs: inputs,
                output: output,
                componentPrettyName: "Circle",
                drawPreview: true
            });
            this.base_init(args);
        },
        recalculate: function(){
            this.output.clearValues();

            // TODO: Protect against errors with zero-radius circles
            var result = DataMatcher([this["C"],this["N"],this["R"]],function(c,n,r){
                if (r === 0) return null;
                return new Geometry.CircleCNR(c,n,r);
            });

            this.output.replaceData(result.tree);
            this._recalculate();
        },
        drawPreviews: function(){
            this.clearPreviews(); // needed here since this component does not have a recalculate phase that deletes prior previews
            var that=this;
            this.output.getTree().recurseTree(function(data){
                _.each(data, function(curve){
                    that.previews.push(new Preview.CurvePreview(curve));
                });
            });
        }
    });

    return DataFlow;
});
