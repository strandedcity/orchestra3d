define([
    "underscore",
    "dataFlow/core"
],function(_,DataFlow){
    var components = {};
    components.BooleanComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = new DataFlow.OutputBoolean();

            var inputs = [new DataFlow.OutputBoolean({shortName: "B", required: false})];

            var args = _.extend({
                inputs: inputs,
                output: output,
                componentPrettyName: "Bool"
            },opts || {});
            this.base_init(args);
        },
        recalculate: function(){
            this.output.clearValues();
            this.output.values = this.inputs['B'].values.copy();

            this._recalculate();
        }
    });

    //
    // THESE ARE SHIT
    //
    components.BooleanTrueComponent = function BooleanTrueComponent(opts){
        var args = _.extend({componentPrettyName: "True"},opts || {});
        _.extend(this,components.BooleanComponent.prototype);
        this.initialize.call(this,args);
        this.output.assignValues([true]);
        this.recalculate = this._recalculate; // simple pass-through of events means value can't be changed.
    };
    components.BooleanFalseComponent = function BooleanFalseComponent(opts){
        var args = _.extend({componentPrettyName: "False"},opts || {});
        _.extend(this,components.BooleanComponent.prototype);
        this.initialize.call(this,args);
        this.output.assignValues([false]);
        this.recalculate = this._recalculate; // simple pass-through of events means value can't be changed.
    };

    return components;
});

