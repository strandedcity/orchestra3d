define([
    "underscore",
    "dataFlow/core",
    "dataFlow/dataMatcher"
],function(_,DataFlow,DataMatcher){
    var components = {};

    // All the simple math functions do simple mathematical expressions on one or two numbers,
    // so they really want to all be boiled down to the simplest amount of nothing. Here's a base class
    // to make each component child's play:
    var simpleMathComponent = DataFlow.Component.extend({
        simpleMathInitialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "N", type: DataFlow.OUTPUT_TYPES.NUMBER}
            ], opts, "output");

            var args = _.extend({
                componentPrettyName: opts.simpleMathName,
                preview: false
            },opts || {},{
                inputs: this.prepareNumericInputs(opts),
                output: output
            });

            this.recalculate = function(){
                var resultObject = DataMatcher(this.inputs,opts.simpleMathFunction);

                this.getOutput("N").replaceData(resultObject.tree);
                this._recalculate();
            };

            this.base_init(args);
        },
        prepareNumericInputs: function(opts){
            var inputSpecs = [
                {shortName: "A", type: DataFlow.OUTPUT_TYPES.NUMBER},
                {shortName: "B", type: DataFlow.OUTPUT_TYPES.NUMBER}
            ];
            if (opts.simpleMathInputCount === 1) {
                inputSpecs[0].shortName = "N";
                inputSpecs.pop();
            }

            return this.createIObjectsFromJSON(inputSpecs, opts, "inputs")
        },
        drawPreviews: function(){
            // noop
        }
    });

    ///////////////////////////// COMPONENTS BEGIN HERE

    components.MathMultiplyComponent = simpleMathComponent.extend({
        initialize: function(opts){
            opts.simpleMathName = "Multiply";
            opts.simpleMathFunction = function(a,b){return a*b;};
            opts.simpleMathInputCount = 2;

            this.simpleMathInitialize(opts);
        }
    });
    components.MathDivideComponent = simpleMathComponent.extend({
        initialize: function(opts){
            opts.simpleMathName = "Divide";
            opts.simpleMathFunction = function(a,b){return a/b;};
            opts.simpleMathInputCount = 2;

            this.simpleMathInitialize(opts);
        }
    });
    components.MathMaxComponent = simpleMathComponent.extend({
        initialize: function(opts){
            opts.simpleMathName = "Max";
            opts.simpleMathFunction = function(a,b){return Math.max(a,b);};
            opts.simpleMathInputCount = 2;

            this.simpleMathInitialize(opts);
        }
    });
    components.MathMinComponent = simpleMathComponent.extend({
        initialize: function(opts){
            opts.simpleMathName = "Min";
            opts.simpleMathFunction = function(a,b){return Math.min(a,b);};
            opts.simpleMathInputCount = 2;

            this.simpleMathInitialize(opts);
        }
    });

    components.MathAddComponent = simpleMathComponent.extend({
        initialize: function(opts){
            opts.simpleMathName = "Add";
            opts.simpleMathFunction = function(a,b){return a+b;};
            opts.simpleMathInputCount = 2;

            this.simpleMathInitialize(opts);
        }
    });
    components.MathSubtractComponent = simpleMathComponent.extend({
        initialize: function(opts){
            opts.simpleMathName = "Subtract";
            opts.simpleMathFunction = function(a,b){return a-b;};
            opts.simpleMathInputCount = 2;

            this.simpleMathInitialize(opts);
        }
    });

    components.MathSineComponent = simpleMathComponent.extend({
        initialize: function(opts){
            opts.simpleMathName = "Sine";
            opts.simpleMathFunction = function(a){return Math.sin(a);};
            opts.simpleMathInputCount = 1;

            this.simpleMathInitialize(opts);
        }
    });
    components.MathCosineComponent = simpleMathComponent.extend({
        initialize: function(opts){
            opts.simpleMathName = "Cosine";
            opts.simpleMathFunction = function(a){return Math.cos(a);};
            opts.simpleMathInputCount = 1;

            this.simpleMathInitialize(opts);
        }
    });
    components.MathTangentComponent = simpleMathComponent.extend({
        initialize: function(opts){
            opts.simpleMathName = "Tangent";
            opts.simpleMathFunction = function(a){return Math.tan(a);};
            opts.simpleMathInputCount = 1;

            this.simpleMathInitialize(opts);
        }
    });
    components.MathExponentComponent = simpleMathComponent.extend({
        initialize: function(opts){
            opts.simpleMathName = "Exponent";
            opts.simpleMathFunction = function(a,b){return Math.pow(a,b);};
            opts.simpleMathInputCount = 2;

            this.simpleMathInitialize(opts);
        }
    });

    return components;
});

