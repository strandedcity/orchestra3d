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

        var inputs = [new DataFlow.OutputBoolean({shortName: "B"})];

        var args = _.extend({
            inputs: inputs,
            output: output,
            resultFunction: this.recalculate,
            componentPrettyName: "Bool"
        },opts || {});
        this.base_init(args);
    };

    DataFlow.BooleanComponent.prototype.recalculate = function(){
        var that = this, shortestInput = this.shortestInputLength();
        if (shortestInput === 0) return;
        for (var i=0; i < shortestInput; i++) {
            that.output.values[i] = this.inputs["B"].values[i];
        }
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

