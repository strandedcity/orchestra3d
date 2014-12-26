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
                componentPrettyName: "Number"
            });
            this.base_init(args);
        },
        recalculate: function(){
            this.output.clearValues();
            this.output.values = this.inputs['#'].values.copy();
            this._recalculate();
        },
        parseInputAndSet: function(input){
            var arr = [];
            try {
                var arrStr = "[" + input.replace(/[\s,]+$/, "") + "]";
                    arr = JSON.parse(arrStr);
            } catch (e){
                console.warn("Failed to parse user-entered numbers: " + input);
            }

            // empty out number if failure to parse
            this.output.assignValues(arr);
        }
    });

    return DataFlow;
});

