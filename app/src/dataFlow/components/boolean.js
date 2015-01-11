define([
    "underscore",
    "dataFlow/core"
],function(_,DataFlow){
    var components = {};
    components.BooleanToggleComponent = DataFlow.Component.extend({
        initialize: function(opts){
            this.setupBooleanComponent(opts,true,true,"Boolean");
        },
        setupBooleanComponent: function(opts,nullInput,defaultValue,name){
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
                componentPrettyName: name
            });
            this.base_init(args);
        },
        recalculate: function(){
            this.getOutput("B").clearValues();
            this.getOutput("B").replaceData(this.getInput("B").getTree().copy());
            //this.getOutput("B").values = this.getInput("B").getTree().copy();
            this._recalculate();
        }
    });

    // A couple convenience components that don't do much
    components.BooleanTrueComponent = components.BooleanToggleComponent.extend({
        initialize: function(opts){
            this.setupBooleanComponent(opts,true,true,"True");
        }
    });
    components.BooleanFalseComponent = components.BooleanToggleComponent.extend({
        initialize: function(opts){
            this.setupBooleanComponent(opts,true,false,"False");
        }
    });

    return components;
});

