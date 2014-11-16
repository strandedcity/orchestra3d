define([
        "underscore",
        "backbone"
    ],function(_,Backbone){
        console.warn("Should remove Module.Utils from core.js and all Dataflow files!!");
        var DataFlow = {};
        DataFlow.Output = function Output(opts){
            // Output objects are able to extract bits of information from a raw result pointer, via a passed-in function
            // This could be as simple as returning the array of pointers directly, or it could mean querying those objects
            // for some property and creating that array instead.
            var args = _.extend(opts || {}, {/* default args */});
            if (_.isUndefined(args.type)) {throw new Error("No type specified for Output");}
            if (_.isUndefined(args.shortName)) {throw new Error("No shortName specified for Output");}

            this.required = _.isUndefined(args.required) ? true : false;
            this.type = args.type;
            this.shortName = args.shortName;
            this.values = [];
            this._isNull = true;
            this.referencedCPointer = null;

            _.extend(this, Backbone.Events, {
                assignValues: function(valueArray){
                    if (!_.isArray(valueArray)) {
                        this.setNull(true);
                        throw new Error("'Values' must be an array");
                    }
                    _.each(valueArray,function(v){
                        if (typeof v !== "number" && typeof  v !== "boolean") {throw new Error("Only Numeric & Boolean values can be assigned directly.");}
                    });
                    this.values = valueArray;
                    this.setNull(valueArray.length === 0);
                    this.trigger('change');
                },
                setNull: function(val){
                    var trigger = val !== this._isNull;
                    this._isNull = val;
                    if (trigger) this.trigger('change');
                },
                isNull: function(){
                    return this._isNull;
                },
                fetchValues: function(){
                    return this._isNull ? null : this.values;
                },
                clearValues: function(){
                    _.each(this.values,function(object){
                        // critical to manually free emscripten memory. Test by cyclically destroying a single curve. The pointer will be the same each time
                        // if memory is being cleared out appropriately. log(geocurve._pointer) to see it in action
                        object.destroy();
                    });
                    this.values.splice(0,this.values.length); // clear out all values
                },
                destroy: function(){
                    this.stopListening();
                    if (!_.isUndefined(this.referencedCPointer)) {Module.Utils.freeCArrayAtPointer(this.referencedCPointer);}
                },
                connectOutput: function(outputModel){
                    // for inputs only, supports the data-flow attachment mechanism
                    var that = this;
                    if (this.type !== outputModel.type) { throw new Error("Incongruent output connected to an input"); }
                    this.stopListening(); // TODO: To connect multiple outputs to an input, this line must change!
                    this.listenTo(outputModel, "change",function(){
                        // check for changes in null state and value
                        var changed = false;
                        if (that.fetchValues() !== outputModel.fetchValues) {
                            that.values = outputModel.values;
                            that._isNull = outputModel._isNull;
                            changed = true;
                        }
                        if (changed) that.trigger("change"); // the input can trigger its change event right away. The COMPONENT does the recalculation
                    });
                    outputModel.trigger("change"); // check for completed flow on hookup
                    this.trigger("connectedOutput", outputModel);
                }
            });
        };

        /*  Output Data types */
        DataFlow.OutputNumber = function OutputNumber(opts) { DataFlow.Output.call(this,_.extend({type: "number", shortName: "N"},opts || {})); };
        DataFlow.OutputPoint = function OutputPoint(opts) { DataFlow.Output.call(this,_.extend({type: "GeoPoint", shortName: "P"},opts || {})); };
        DataFlow.OutputCurve = function OutputCurve(opts) { DataFlow.Output.call(this,_.extend({type: "GeoCurve", shortName: "C"},opts || {})); };
        DataFlow.OutputBoolean = function OutputBoolean(opts) { DataFlow.Output.call(this,_.extend({type: "boolean", shortName: "B"},opts || {})); };

        var DATAFLOW_IO_TYPES = {
            number: DataFlow.OutputNumber,
            GeoPoint: DataFlow.OutputPoint,
            GeoCurve: DataFlow.OutputCurve,
            boolean: DataFlow.OutputBoolean
        };

        var Component = DataFlow.Component = function Component(opts){
            /*
            *  A general function must be supplied for the calculation of the result objects.
            *  Generally, this function will wrap something in the SISL library
            *  E.g., "Arc3pt" might generate a curve through three input points,
            *  But "radius" might be an optional output from the Component.
            *  "Arc3Pt" would be the "result function" while "radius" would be an output with its own
            *  JS function that knows how to extract "radius" from the result curve
            *
            *  Every component must know what inputs to receive, what outputs to emit,
            *  and how to generate each.
            *
            *  Outputs are not calculated unless subscribed to.
            *
            *  Each named output must specify a separate function to extract a particular value from the
            *  actual output objects.
            *
            * */
            this.base_init.apply(this, arguments);
        };

        // Mix in backbone events so this component can interact with other components
        _.extend(Component.prototype, Backbone.Events, {
            base_init: function(opts){
                if (_.isUndefined(opts) || _.isUndefined(opts.inputs) || _.isUndefined(opts.resultFunction) || _.isUndefined(opts.output) ) {
                    throw new Error("Insufficient specifications for a Component");
                }

                this._sufficient = false;

                // Inputs and outputs are arrays of Ant.Inputs and Ant.Outputs
                this.inputTypes = opts.inputTypes;
                this.output = opts.output; // Contains raw result object pointers after async calculation completes.
                this.inputs = this.initializeInputs(opts.inputs);
                this.componentPrettyName = opts.componentPrettyName;
                this.position = opts.position || {x: 0, y:0}; // May seem like "view stuff", but the components need to store their screen location as part of the data, given drag and drop

                this._calculateSufficiency(); // some components don't require inputs, so we need to make sure this._sufficient gets updated appropriately on init

                this._drawPreview = opts.drawPreview || false;
                this.previews = [];
            },
            initializeInputs: function(inputs){
                // when no inputs are required, sufficiency must be calculated differently
                // ie, if values can be assigned directly, sufficiency = (inputs satisfied | output assigned)
                var hasRequired = false;

                var that = this;
                _.each(inputs,function(inputModel){
                    that[inputModel.shortName] = inputModel;
                    that.listenTo(inputModel,"change",that.recalculateIfReady);
                    if (inputModel.required === true) {hasRequired = true;}
                });

                this._hasRequiredInputs = hasRequired;

                // for components that let users enter data directly, we need to listen directly to the output for changes in value
                if (hasRequired === false) {
                    this.listenTo(this.output,"change",that._calculateSufficiency   );
                }

                return inputs;
            },
            assignInput: function(inputName, output){
                // TODO: 'input' in the function signature actually refers to the OUTPUT that's supposed to be connected to inputName

                if (_.isUndefined(inputName) || _.isUndefined(output)) {throw new Error("Unspecified Input");}
                if (!_.has(this,inputName)) {throw new Error("Tried to specify an input that does not exist");}
                if (this[inputName].type !== output.type) {throw new Error("Tried to specify an input of the wrong type");}

                var input = this[inputName];

                this[inputName].connectOutput(output); // matches signature found in inputOutputView.js

                this._calculateSufficiency();
            },
            destroy: function(){
                this.stopListening();
//                Can't destroy inputs just because this component doesn't need them anymore!!
//                _.each(this.inputs,function(input){
//                    input.destroy();
//                });
                delete this.inputs;
                this.output.destroy();
                delete this.output;
            },
            recalculateIfReady: function(){
                // clear previews for any change in input. They will either be removed and replaced, or only removed:
                this.clearPreviews();

                // poll inputs to check status. Recalculate sufficiency, since this reflects a change in inputs
                if (this._calculateSufficiency() === true) {
                    this.recalculate();
                } else {
                    this.output.setNull(true);
                }
            },
            hasSufficientInputs: function(){
                return this._sufficient;
            },
            _calculateSufficiency: function(){
                var sufficient = true;

                // next, verify that none of the inputs are nulled-out:
                if (this._hasRequiredInputs === true){
                    _.each(this.inputs,function(input){
                        if (input.isNull() === true && input.required === true) {
                            sufficient = false;
                        }
                    });
                }

                // some output values, when inputs can come straight from the user (ie, numbers, booleans, functions), don't require any inputs
                // However, in this case, the output value must be actually set before the component can be called sufficient
                if (this._hasRequiredInputs === false && _.isNull(this.output.fetchValues())) {
                    sufficient = false;
                }

                // If an input is null, the output is null too, and no calculation should occur.
                //if (!sufficient) this.output.setNull(true);
                if (this._sufficient !== sufficient) {
                    this._sufficient = sufficient;
                    this.trigger("sufficiencyChange",sufficient);
                }

                return sufficient;
            },
            shortestInputLength: function(){
                if (this.hasSufficientInputs() === false) return 0;

                this.output.setNull(false);
                var shortestIpt = _.min(this.inputs,function(ipt){return ipt.values.length;});
                return shortestIpt.values.length;
            },
            recalculate: function(){
                this._recalculate();
            },
            _recalculate: function(){
                // run whatever calculations are necessary, if all inputs are available
                this.output.trigger('change');
            },
            fetchOutputs: function(){
                return this.output.fetchValues();
            },
            isNull: function(){
                return this.output.isNull();
            },
            clearPreviews: function(){
                // destroy prior views
                _.each(this.previews,function(prev){
                    prev.remove();
                });
                this.previews.splice(0,this.previews.length); // make sure the previews can be deallocated. remove references.
            },
        });

        return DataFlow;
    }
);




