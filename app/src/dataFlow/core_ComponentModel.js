define([
    "underscore",
    "backbone",
    "dataFlow/core_IOModels"
],function(_,Backbone, IOModels){


    var component = Backbone.Model.extend({

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
        createIObjectsFromJSON: function(schemaListJSON,opts,dataKey){
            var objectList = [],
                constructorMap = {
                    output: IOModels["Output"],
                    inputs: IOModels["Input"]
                };
            // "schemaList" we trust -- it's part of the program.
            // "inputList" we don't -- it's data that gets saved with the files
            // Basically we take the schema, ask the inputlist if it has anything that modifies those inputs in appropriate ways, and move on.

            var correspondingUserData = _.isUndefined(opts) ? {} : _.isUndefined(opts[dataKey]) ? {} : opts[dataKey];
            _.each(_.values(schemaListJSON),function(spec){
                var providedData = _.findWhere(correspondingUserData, {shortName: spec.shortName, type: spec.type});
                var outputObject = new constructorMap[dataKey](_.extend(providedData || {},spec));
                objectList.push(outputObject);
            });

            // TODO: Here's a hack until I figure out multiple outputs
            if (dataKey === "output") return objectList[0];
            return objectList;
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
            this.position = opts.position || {x: 0, y:0}; // May seem like "view stuff", but the components need to store their screen location as part of the data, given drag and drop

            this._calculateSufficiency(); // some components don't require inputs, so we need to make sure this._sufficient gets updated appropriately on init

            this.set('componentPrettyName', opts.componentPrettyName);
            this.set('preview',opts.preview || false);
            this.previews = [];

            // Update previews. This is sort of "view stuff" but it's close to being "data stuff." Located here for now.
            this.on("change:preview",function(){
                this.clearPreviews();
                if (this.get('preview') === true) {
                    this.drawPreviews();
                }
            });
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
            this.output.destroy();
            this.trigger('removed');
            _.each(this.inputs,function(ipt){
                ipt.destroy();
            });
            this.off();
            this.stopListening();
            delete this.inputs;
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
            if (this.get('preview') === true) {
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
            var inputData = [];
            _.each(this.inputs,function(ipt){
                inputData.push(ipt.toJSON());
            });

            return {
                componentPrettyName: this.attributes.componentPrettyName,
                componentName: this.componentName,
                position: this.position,
                preview: this.attributes.preview,
                inputs: inputData,
                output: [this.output.toJSON()],
                id: this.id || this.cid
            };
        }
    });

    return component;

});