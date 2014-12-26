define([
    "underscore",
    "dataFlow/core"
],function(_,DataFlow){
    var BooleanComponent = DataFlow.BooleanComponent = function BooleanComponent(opts){
        this.initialize.apply(this, arguments);
    };

    DataFlow.BooleanComponent.prototype.initialize = function(opts){
        _.extend(this, DataFlow.Component.prototype);
        var output = new DataFlow.OutputBoolean();

        var inputs = [new DataFlow.OutputBoolean({shortName: "B", required: false})];

        var args = _.extend({
            inputs: inputs,
            output: output,
            componentPrettyName: "Bool"
        },opts || {});
        this.base_init(args);
    };

    DataFlow.BooleanComponent.prototype.recalculate = function(){

        this.output.clearValues();
        this.output.values = this.inputs['B'].values.copy();

        this._recalculate();
    };

    /*
    * A couple of fixed-value components to mirror grasshopper's, for the time being
    */
    DataFlow.BooleanTrueComponent = function BooleanTrueComponent(opts){
        var args = _.extend({componentPrettyName: "True"},opts || {});
        _.extend(this,BooleanComponent.prototype);
        this.initialize.call(this,args);
        this.output.assignValues([true]);
        this.recalculate = this._recalculate; // simple pass-through of events means value can't be changed.
    };
    DataFlow.BooleanFalseComponent = function BooleanFalseComponent(opts){
        var args = _.extend({componentPrettyName: "False"},opts || {});
        _.extend(this,BooleanComponent.prototype);
        this.initialize.call(this,args);
        this.output.assignValues([false]);
        this.recalculate = this._recalculate; // simple pass-through of events means value can't be changed.
    };

    return DataFlow;
});

