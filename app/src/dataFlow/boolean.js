define([
    "underscore",
    "dataFlow/core"
],function(_,DataFlow){
    var BooleanComponent = DataFlow.BooleanComponent = function BooleanComponent(opts){
        this.initialize.apply(this, arguments);
    };

    _.extend(BooleanComponent.prototype, DataFlow.Component.prototype,{
        initialize: function(opts){
            var output = new DataFlow.OutputBoolean();

            var args = _.extend(opts || {},{
                inputTypes: {
                    "B": 'boolean'
                },
                output: output,
                resultFunction: this.recalculate,
                componentPrettyName: "Bool"
            });
            this.base_init(args);
        },
        recalculate: function(){
            var that = this, shortestInput = this.shortestInputLength();
            if (shortestInput === 0) return;
            for (var i=0; i < shortestInput; i++) {
                that.output.values[i] = this.inputs["B"].values[i];
            }
            this._recalculate();
        },
    });

    return DataFlow;
});

