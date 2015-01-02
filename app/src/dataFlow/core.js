define([
        "underscore",
        "backbone",
        "dataFlow/dataTree",
        "dataFlow/dataMatcher",
        "dataFlow/enums"
    ],function(_,Backbone,DataTree,DataMatcher, ENUMS){

        console.warn("Should remove Module.Utils from core.js and all Dataflow files!!");
        var DataFlow = {};
        DataFlow.Output = Backbone.Model.extend({
            initialize: function(opts){
                // Output objects are able to extract bits of information from a raw result pointer, via a passed-in function
                // This could be as simple as returning the array of pointers directly, or it could mean querying those objects
                // for some property and creating that array instead.
                var args = _.extend(opts || {}, {/* default args */});
                if (_.isUndefined(args.type)) {throw new Error("No type specified for Output");}
                if (_.isUndefined(args.shortName)) {throw new Error("No shortName specified for Output");}

                this.required = _.isUndefined(args.required) ? true : args.required;
                this.type = args.type;
                this.default = _.isUndefined(args.default) ? null : args.default; // store default value if spec'd
                this.shortName = args.shortName;
                this.values = new DataTree([]);
                this._isNull = true;

                var parameterType = ENUMS.INTERPRET_AS.ITEM;
                if (!_.isUndefined(args.interpretAs)) {
                    if (!_.has(_.keys(ENUMS.INTERPRET_AS), args.interpretAs)) {
                        console.warn("Invalid list interpretation type passed to an input. Using default ITEM interpretation. See ENUMS.INTERPRET_AS");
                    } else {
                        parameterType = ENUMS.INTERPRET_AS[args.interpretAs];
                    }
                }
                this.interpretAs = parameterType;
            },
            assignValues: function(values, forPath){
                if (!_.isArray(values)) {
                    this.setNull(true);
                    throw new Error("'Values' must be an array");
                }
                _.each(values,function(v){
                    if (typeof v !== "number" && typeof  v !== "boolean") {throw new Error("Only Numeric & Boolean values can be assigned directly.");}
                });

                // store data
                this.values.addChildAtPath(values,forPath || [0],true);

                this.setNull(this.values.isEmpty());

                this.trigger('change');
            },
            replaceData: function(dataTree){
                if (dataTree.constructor.name !== "DataTree") {
                    throw new Error("Attempt to replace Data Tree with something that's not a Data Tree.");
                }
                this.clearValues();
                this.values = dataTree;
                this.setNull(this.values.isEmpty());

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
            getTree: function(){
                //return this._isNull ? null : this.values;
                return this.values;
            },
            getDefaultValue: function(){
                return this.default;
            },
            getFirstValueOrDefault: function(){
                // many times, we'll want the first value if it's been connected, or the default if it hasn't
                var firstDataPath = this.getTree().dataAtPath([0]);
                if (_.isEmpty(firstDataPath)) return this.getDefaultValue();
                return this.getTree().dataAtPath([0])[0];
            },
            clearValues: function(){
                this.values.recurseTree(function(data,node){
                    _.each(data, function(object){
                        // critical to manually free emscripten memory. Test by cyclically destroying a single curve. The pointer will be the same each time
                        // if memory is being cleared out appropriately. log(geocurve._pointer) to see it in action
                        if (!_.isNull(object) && typeof object.destroy === "function") object.destroy();
                        else if (!_.isNull(object)) console.warn("Can't destroy object type: " + typeof object + " / constructor: " + object.constructor.name);
                    });
                    node.data.splice(0,node.data.length); // clear out all values
                });
            },
            destroy: function(){
                this.clearValues();
                this.stopListening();
            },
            validateOutput: function(outputModel){
                // for inputs only, supports the data-flow attachment mechanism
                if (this.type !== outputModel.type && this.type !== "wild" && outputModel.type !== "wild") { throw new Error("Incongruent output connected to an input"); }

                return true;
            },
            connectOutput: function(outputModel){
                try {
                    if (this.validateOutput(outputModel) === true) this.stopListening();
                    this.connectAdditionalOutput(outputModel, false);
                } catch (e){
                    console.warn('Caught an error during connection: ', e.message, e.stack);
                }
            },
            connectAdditionalOutput: function(outputModel, validateModels){
                if (validateModels !== false) this.validateOutput(outputModel);

                var that=this;
                this.listenTo(outputModel, "change",function(){
                    // check for changes in null state and value
                    //var changed = false;
                    //if (that.getTree() !== outputModel.getTree()) { // THIS TEST FAILS. I'm trying to test if values IN the tree have changed, but when the components are previously connected this prevents change events from propagating.
                    that.values = outputModel.values;
                    that._isNull = outputModel._isNull;
                    //changed = true;
                    //}
                    //if (changed === true) that.trigger("change"); // the input can trigger its change event right away. The COMPONENT does the recalculation
                    that.trigger("change");
                });
                outputModel.trigger("change"); // check for completed flow on hookup
                this.trigger("connectedOutput", outputModel);
            },
            toJSON: function(){
                return {
                    shortName: this.shortName,
                    guid: this.id || this.cid,
                    connections: _.map(this._listeningTo,function(output){
                        return output.guid;
                    })
                }
            }


        });

        /*  Output Data types */
        DataFlow.OutputNumber = function OutputNumber(opts) {
            return new DataFlow.Output(_.extend({type: "number", shortName: "N"},opts || {}));
        };
        DataFlow.OutputPoint = function OutputPoint(opts) {
            return new DataFlow.Output(_.extend({type: "GeoPoint", shortName: "P"},opts || {}));
        };
        DataFlow.OutputCurve = function OutputCurve(opts) {
            return new DataFlow.Output(_.extend({type: "GeoCurve", shortName: "C"},opts || {}));
        };
        DataFlow.OutputBoolean = function OutputBoolean(opts) {
            return new DataFlow.Output(_.extend({type: "boolean", shortName: "B"},opts || {}));
        };
        DataFlow.OutputMultiType = function OutputMultiType(opts) {
            return new DataFlow.Output( _.extend({type: "wild", shortName: "T"}, opts || {}));
        };
        DataFlow.OutputNull = function OutputNull(opts) {
            return new DataFlow.Output(_.extend({type: "null", shortName: "x"}, opts || {}));
        };

        var Component = DataFlow.Component = Backbone.Model.extend({

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

            initialize: function(){
                this.base_init.apply(this, arguments);
            },
            base_init: function(opts){
                if (_.isUndefined(opts) || _.isUndefined(opts.inputs) || _.isUndefined(opts.output) ) {
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
                // TODO: DOES THIS CAUSE CALCULATIONS TWICE?
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

                this[inputName].connectOutput(output); // matches signature found in inputOutputView.js

                this._calculateSufficiency();
            },
            destroy: function(){
                this.stopListening();
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
                        if ((input.getTree().isEmpty() === true || input.isNull()) && input.required === true) {
                            sufficient = false;
                        }
                    });
                }

                // some output values, when inputs can come straight from the user (ie, numbers, booleans, functions), don't require any inputs
                // However, in this case, the output value must be actually set before the component can be called sufficient
                if (this._hasRequiredInputs === false && _.isNull(this.output.getTree())) {
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
            recalculate: function(){
                console.warn("DataFlow.Component.recalculate() was called directly. This method should be overridden for all component types.");
                this._recalculate();
            },
            _recalculate: function(){
                this.output.setNull(this.output.values.isEmpty());

                // run whatever calculations are necessary, if all inputs are available
                if (this._drawPreview) {
                    this.drawPreviews();
                }

                this.output.trigger('change');
            },
            fetchOutputs: function(){
                /* This function is stupid. It may be useful for writing tests, but it doesn't deal with the data trees in any useful way */
                return this.output.getTree().flattenedTree().dataAtPath([0]);
            },
            isNull: function(){
                return this.output.isNull();
            },
            drawPreviews: function(){
                console.warn(this.constructor.name + " objects have a no-op 'drawPreviews' function.")
            },
            clearPreviews: function(){
                // destroy prior views
                _.each(this.previews,function(prev){
                    prev.remove();
                });
                this.previews.splice(0,this.previews.length); // make sure the previews can be deallocated. remove references.
            },
            toJSON: function(){
                var inputs = {};
                _.each(this.inputs,function(ipt){
                    inputs[ipt.shortName] = ipt.toJSON();
                });

                return {
                    componentName: this.componentName,
                    position: this.position,
                    drawPreview: this._drawPreview,
                    inputs: inputs,
                    id: this.id || this.cid
                };
            }
        });

        return DataFlow;
    }
);




