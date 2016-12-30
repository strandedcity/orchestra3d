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
                outputs: output,
                componentPrettyName: name
            });
            this.base_init(args);

            // Initially, the input must be copied to the output tree or the output will be empty
            this._handleInputChange();
        },
        recalculate: function(){
            this.getOutput("B").replaceData(this.getInput("B").getTree().copy());
        }
    },{
        "label": "Boolean Toggle",
        "desc": "This component gives you a convenient way to switch between a single True or False value"
    });

    // A couple convenience components that don't do much
    components.BooleanTrueComponent = components.BooleanToggleComponent.extend({
        initialize: function(opts){
            this.setupBooleanComponent(opts,true,true,"True");
        }
    },{
        "label": "True",
        "desc": "Outputs a boolean True value"
    });

    components.BooleanFalseComponent = components.BooleanToggleComponent.extend({
        initialize: function(opts){
            this.setupBooleanComponent(opts,true,false,"False");
        }
    },{
        "label": "False",
        "desc": "Outputs a boolean False value"
    });

    return components;
});

