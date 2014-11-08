define([
    "underscore",
    "dataFlow/core"
],function(_,DataFlow){
    var NumberComponent = DataFlow.NumberComponent = function NumberComponent(opts){
        this.initialize.apply(this, arguments);
    };

    _.extend(NumberComponent.prototype, DataFlow.Component.prototype,{
        initialize: function(opts){
            var output = new DataFlow.OutputNumber();

            var input = new DataFlow.OutputNumber({required: false, shortName: "#"});

            var args = _.extend(opts || {},{
                inputs: [
                    input
                ],
                output: output,
                resultFunction: this.recalculate,
                componentPrettyName: "Number"
            });
            this.base_init(args);
        },
        recalculate: function(){
            var that = this, shortestInput = this.shortestInputLength();
            if (shortestInput === 0) return;
            for (var i=0; i < shortestInput; i++) {
                that.output.values[i] = this.inputs["#"].values[i];
            }
            this._recalculate();
        }
    });

    return DataFlow;
});
