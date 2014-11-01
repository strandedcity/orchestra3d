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
                    this.setNull(false);
                    this.trigger('change');
                },
                setNull: function(val){
                    this._isNull = val;
                    this.trigger('change');
                },
                isNull: function(){
                    return this._isNull;
                },
                fetchValues: function(){
                    return this._isNull ? null : this.values;
                },
                destroy: function(){
                    if (!_.isUndefined(this.referencedCPointer)) {Module.Utils.freeCArrayAtPointer(this.referencedCPointer);}
                },
            });
        };

        /*  Output Data types */
        DataFlow.OutputNumber = function OutputNumber(opts) { DataFlow.Output.call(this,_.extend(opts || {}, {type: "number", shortName: "N"})); };
        DataFlow.OutputPoint = function OutputPoint(opts) { DataFlow.Output.call(this,_.extend(opts || {}, {type: "GeoPoint", shortName: "P"})); };
        DataFlow.OutputCurve = function OutputCurve(opts) { DataFlow.Output.call(this,_.extend(opts || {}, {type: "GeoCurve", shortName: "C"})); };
        DataFlow.OutputBoolean = function OutputBoolean(opts) { DataFlow.Output.call(this,_.extend(opts || {}, {type: "boolean", shortName: "B"})); };

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
                if (_.isUndefined(opts) || _.isUndefined(opts.inputTypes) || _.isUndefined(opts.resultFunction) || _.isUndefined(opts.output) ) {
                    throw new Error("Insufficient specifications for a Component");
                }

                // Inputs and outputs are arrays of Ant.Inputs and Ant.Outputs
                this.inputTypes = opts.inputTypes;
                this.inputs = {};
                this.output = opts.output; // Contains raw result object pointers after async calculation completes.
                this.componentPrettyName = opts.componentPrettyName;
                this.position = opts.position || {x: 0, y:0}; // May seem like "view stuff", but the components need to store their screen location as part of the data, given drag and drop
            },
            assignInput: function(inputName, input){
                if (_.isUndefined(inputName) || _.isUndefined(input)) {throw new Error("Unspecified Input");}
                if (!_.has(this.inputTypes,inputName)) {throw new Error("Tried to specify an input that does not exist");}
                if (this.inputTypes[inputName] !== input.type) {throw new Error("Tried to specify an input of the wrong type");}

                // Stop listening to all inputs, then re-instate on current ones:
                this.stopListening();

                // Still here? Cool. Just listen to the output for change events.
                this.inputs[inputName] = input; // keep a ref
                var that = this;
                _.each(this.inputs,function(ipt){
                    that.listenTo(ipt, 'change', that.recalculate);
                });

                // Does this addition of an input leave the component with all inputs satisfied?
                if (this.hasSufficientInputs()){
                    this.recalculate();
                }
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
            hasSufficientInputs: function(){
                var that = this, sufficient = true;

                // first verify that all the inputs are even hooked up:
                _.each(_.keys(this.inputTypes),function(inputName){
                    if (!_.has(that.inputs,inputName)) {
                        sufficient = false;
                    }
                });

                // next, verify that none of the inputs are nulled-out:
                _.each(this.inputs,function(input){
                    if (input.isNull() === true) {
                        sufficient = false;
                    }
                });
                // If an input is null, the output is null too, and no calculation should occur.
                if (!sufficient) that.output.setNull(true);
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
            }
        });

        return DataFlow;
    }
);




