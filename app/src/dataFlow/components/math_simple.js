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
                outputs: output
            });

            this.recalculate = opts.simpleMathFunction;

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
            opts.simpleMathFunction = function(a,b){return {N:a*b};};
            opts.simpleMathInputCount = 2;

            this.simpleMathInitialize(opts);
        }
    },{
        "label": "Multiply",
        "desc": "Returns the product of two numbers"
    });
    
    components.MathDivideComponent = simpleMathComponent.extend({
        initialize: function(opts){
            opts.simpleMathName = "Divide";
            opts.simpleMathFunction = function(a,b){return {N:a/b};};
            opts.simpleMathInputCount = 2;

            this.simpleMathInitialize(opts);
        }
    },{
        "label": "Divide",
        "desc": "Divides the first input (a) by the second input (b)"
    });

    components.MathMaxComponent = simpleMathComponent.extend({
        initialize: function(opts){
            opts.simpleMathName = "Max";
            opts.simpleMathFunction = function(a,b){return {N:Math.max(a,b)};};
            opts.simpleMathInputCount = 2;

            this.simpleMathInitialize(opts);
        }
    },{ 
        "label": "Max",
        "desc": "Returns the larger (maximum value) of two numbers"
    });

    components.MathMinComponent = simpleMathComponent.extend({
        initialize: function(opts){
            opts.simpleMathName = "Min";
            opts.simpleMathFunction = function(a,b){return {N:Math.min(a,b)};};
            opts.simpleMathInputCount = 2;

            this.simpleMathInitialize(opts);
        }
    },{
        "label": "Min",
        "desc": "Returns the smaller (minimum value) of two numbers"
    });

    components.MathAddComponent = simpleMathComponent.extend({
        initialize: function(opts){
            opts.simpleMathName = "Add";
            opts.simpleMathFunction = function(a,b){return {N:a+b};};
            opts.simpleMathInputCount = 2;

            this.simpleMathInitialize(opts);
        }
    },{
        "label": "Add",
        "desc": "Returns the sum of two numbers"
    });

    components.MathSubtractComponent = simpleMathComponent.extend({
        initialize: function(opts){
            opts.simpleMathName = "Subtract";
            opts.simpleMathFunction = function(a,b){return {N:a-b};};
            opts.simpleMathInputCount = 2;

            this.simpleMathInitialize(opts);
        }
    },{
        "label": "Subtract",
        "desc": "Subtracts the second input (b) from the first input (a)"
    });

    components.MathSineComponent = simpleMathComponent.extend({
        initialize: function(opts){
            opts.simpleMathName = "Sine";
            opts.simpleMathFunction = function(a){return {N:Math.sin(a)};};
            opts.simpleMathInputCount = 1;

            this.simpleMathInitialize(opts);
        }
    },{
        "label": "Sine(x)",
        "desc": "Returns the sine of the input angle in radians"
    });

    components.MathCosineComponent = simpleMathComponent.extend({
        initialize: function(opts){
            opts.simpleMathName = "Cosine";
            opts.simpleMathFunction = function(a){return {N:Math.cos(a)};};
            opts.simpleMathInputCount = 1;

            this.simpleMathInitialize(opts);
        }
    },{
        "label": "Cosine(x)",
        "desc": "Returns the cosine of the input angle in radians"
    });

    components.MathTangentComponent = simpleMathComponent.extend({
        initialize: function(opts){
            opts.simpleMathName = "Tangent";
            opts.simpleMathFunction = function(a){return {N:Math.tan(a)};};
            opts.simpleMathInputCount = 1;

            this.simpleMathInitialize(opts);
        }
    },{
        "label": "Tangent(x)",
        "desc": "Returns the tangent of the input angle in radians"
    });

    components.MathExponentComponent = simpleMathComponent.extend({
        initialize: function(opts){
            opts.simpleMathName = "Exponent";
            opts.simpleMathFunction = function(a,b){return {N:Math.pow(a,b)};};
            opts.simpleMathInputCount = 2;

            this.simpleMathInitialize(opts);
        }
    },{
        "label": "Exponent a^b",
        "desc": "Returns the first input (a) raised to a power of the second input (b)."
    });


    components.MassAdditionComponent = DataFlow.Component.extend({
        initialize: function(opts){
            this.base_init(
                _.extend({
                    preview: false,
                    componentPrettyName: "MA"
                }, opts || {},{
                    inputs: this.createIObjectsFromJSON([
                                {required: true, shortName: "I", type: DataFlow.OUTPUT_TYPES.WILD, interpretAs: DataFlow.INTERPRET_AS.LIST, desc: "Input values for mass addition (numbers or vectors)"}, 
                            ], opts, "inputs"),
                    outputs: this.createIObjectsFromJSON([
                                {shortName: "R", type: DataFlow.OUTPUT_TYPES.WILD, desc: "Result of Mass Addition"},
                                {shortName: "Pr", type: DataFlow.OUTPUT_TYPES.WILD, interpretAs: DataFlow.INTERPRET_AS.LIST, desc: "Partial Results"}
                            ], opts, "output")
                })
            );
        },
        recalculate: function(inputs){
            var partialResults = [],
                runningTotal = 0;
            _.each(inputs,function(val){
                runningTotal += val;
                partialResults.push(runningTotal);
            });
            return {
                R: runningTotal,
                Pr: partialResults
            }
        }
    },{
        "label": "Mass Addition",
        "desc": "Perform mass addition of a list of items"
    });

    return components;
});

