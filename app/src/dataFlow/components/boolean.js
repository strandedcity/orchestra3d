define([
    "underscore",
    "dataFlow/core"
],function(_,DataFlow){
    var components = {};
    components.BooleanComponent = DataFlow.Component.extend({
        initialize: function(opts){
            this.setupBooleanComponent(opts,false,true);
        },
        setupBooleanComponent: function(opts,nullInput,defaultValue){
            var output = this.createIObjectsFromJSON([
                {shortName: "B", type: DataFlow.OUTPUT_TYPES.BOOLEAN}
            ], opts, "output");

            var inputType = nullInput ? DataFlow.OUTPUT_TYPES.NULL : DataFlow.OUTPUT_TYPES.BOOLEAN;
            var inputs = this.createIObjectsFromJSON([
                {shortName: "B", required:false, default: defaultValue, type: inputType}
            ], opts, "inputs");

            var args = _.extend(opts || {},{
                inputs: inputs,
                output: output,
                componentPrettyName: "Bool"
            });
            this.base_init(args);
        },
        recalculate: function(){
            this.output.clearValues();
            this.output.values = this.inputs['B'].values.copy();
            this._recalculate();
        }
    });

    // A couple convenience components that don't do much
    components.BooleanTrueComponent = components.BooleanComponent.extend({
        initialize: function(opts){
            this.setupBooleanComponent(opts,true,true);
        }
    });
    components.BooleanFalseComponent = components.BooleanComponent.extend({
        initialize: function(opts){
            this.setupBooleanComponent(opts,true,false);
        }
    });

    return components;
});

