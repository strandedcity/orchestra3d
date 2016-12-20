define([
    "underscore",
    "backbone",
    "dataFlow/core_IOModels",
    "dataFlow/pulse",
    "dataFlow/enums",
    "dataFlow/UI/geometryPreviews",
    "SISL/sisl_loader"
],function(_,Backbone, IOModels, Pulse, ENUMS, Preview, Geometry){


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

        modelType: "Component",
        initialize: function(){
            this.base_init.apply(this, arguments);
        },
        createIObjectsFromJSON: function(schemaListJSON,opts,dataKey){
            var objectList = [],
                dataKey = dataKey === "output" ? "outputs" : dataKey, // CODE DEBT! "output" should be "outputs"
                constructorMap = {
                    outputs: IOModels["Output"],
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

            return objectList;
        },
        base_init: function(opts){
            if (_.isUndefined(opts) || _.isUndefined(opts.inputs) || (_.isUndefined(opts.output) && _.isUndefined(opts.outputs)) ) {
                throw new Error("Insufficient specifications for a Component");
            }

            this._sufficient = false;
            _.bindAll(this,"_handleInputChange","_propagatePulse");

            // Inputs and outputs are arrays of Ant.Inputs and Ant.Outputs
            this.outputs = this.initializeOutputs(_.isUndefined(opts.outputs) ? [opts.output] : opts.outputs);
            this.inputs = this.initializeInputs(opts.inputs);
            this.position = opts.position || {x: 0, y:0}; // May seem like "view stuff", but the components need to store their screen location as part of the data, given drag and drop

            //this._handleInputChange(); // some components don't require inputs, so we need to make sure this._sufficient gets updated appropriately on init

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
        initializeOutputs: function(outputs){
            var that = this;
            _.each(outputs,function(out){
                that.on('pulse',function(p){out.trigger('pulse',p)});
            });

            return outputs;
        },
        initializeInputs: function(inputs){
            // when no inputs are required, sufficiency must be calculated differently
            // ie, if values can be assigned directly, sufficiency = (inputs satisfied | output assigned)

            var that = this;
            _.each(inputs,function(inputModel){
                that[inputModel.shortName] = inputModel;
                that.listenTo(inputModel,"pulse",that._propagatePulse)
            });

            return inputs;
        },
        _propagatePulse: function(pulse){
             //console.log(pulse.get('state') + ' pulse received: ',this.get('componentPrettyName'),pulse.cid);

            if (pulse.get('state') === "GRAPH_DISCOVERY") {
                // DO NOT update path counts prior to running calculations if we're in calculation mode
                if (pulse.updatePathCounts(this)) {
                    // propagate now
                    this.trigger('pulse',pulse);
                }
            } else if (pulse.get('state') === "RECALCULATION")  {
                //console.trace();
                this._handleInputChange();
                var propagate = pulse.updatePathCounts(this);
                if (propagate) this.trigger('pulse',pulse);
            }

            //var propagateNow = pulse.updatePathCounts(this);;
            //console.warn("GOT IT. THIS LINE NEEDS TO BE BELOW HANDLEINPUTCHANGE!!! OTHERWISE, the pulse will switch from discvery to recalculation before inputs are connected!!");
            //if (propagateNow) {
            //    if (pulse.get('state') === "GRAPH_DISCOVERY") {
            //        console.log('graph discovery...');
            //        this.trigger('pulse',pulse);
            //    } else if (pulse.get('state') === "RECALCULATION") {
            //        this._handleInputChange(pulse);
            //    }
            //}

        },
        assignInput: function(inputName, output){
            // TODO: 'input' in the function signature actually refers to the OUTPUT that's supposed to be connected to inputName

            if (_.isUndefined(inputName) || _.isUndefined(output)) {throw new Error("Unspecified Input");}
            if (!_.has(this,inputName)) {throw new Error("Tried to specify an input that does not exist");}
            if (this[inputName].type !== output.type) {throw new Error("Tried to specify an input of the wrong type");}
            //console.log('assigning input '+inputName);
            this[inputName].connectOutput(output); // matches signature found in inputOutputView.js

//            this._calculateSufficiency(); // shouldn't be necessary -- the connection will trigger a 'change' on the input if applicable, which the component will be listening for
        },
        getOutput: function(shortName){
            // when there's only one output or you don't specify which you want, this function returns the only output.
            if (!shortName || this.outputs.length === 1) return this.outputs[0];
            return _.findWhere(this.outputs,{shortName: shortName});
        },
        getInput: function(shortName){
            return _.findWhere(this.inputs,{shortName: shortName});
        },
        destroy: function(){
            _.each(this.outputs,function(out){
                out.destroy();
            });
            this.trigger("removed",this);
            _.each(this.inputs,function(ipt){
                ipt.destroy();
            });
            this.off();
            this.stopListening();
            delete this.inputs;
            delete this.outputs;
        },
        _windowFrozenWarnOnce: _.throttle(function(){
            console.warn("WINDOW FROZEN. CALCULATION SKIPPED.");
        },5000),
        _handleInputChange: function(){
            if (window.frozen === true) {
                return this._windowFrozenWarnOnce();
            }

            ////////// PRE-RECALCULtATION -- CHECK STATUS
            //
            // consider current input statuses: do we have enough input to do the calculation?
            var isNullNow = !_.every(this.inputs,function(input){
                var empty =  input.getTree().isEmpty();
                //console.log(input.shortName + " is ", input.getTree());
                //if (empty) console.log(input.values);
                return empty !== true;
            });

            ////////// RECALCULATION PHASE
            //
            this.set({'sufficient': !isNullNow});
            if (!isNullNow) {
                this.recalculate();
                this.simulatedRecalculate();
            } else {

                //console.log("NULL");
            }

            /////////// POST recalculation
            //
            // Run preview phase, remove previews if null
            if (this.get('preview') === true) {
                if (isNullNow) {
                    this.clearPreviews();
                } else {
                    this.drawPreviews();
                }
            }

            // execute post-recalculation stuff: propagate null status, trigger "change" on outputs
            if (isNullNow) this.clear(false);
        },
        clear: function(shouldPulse){
            _.each(this.outputs,function(out){
                out.clearValues();
            });

            if (shouldPulse === true) {
                var p = new Pulse({startPoint: this, pathsOpened: 1}); // as if triggered on an input
                this.trigger('pulse',p);
            }
        },
        isNull: function(){
            return _.every(this.outputs,function(out){
                return out.getTree().isEmpty();
            });
        },
//        recalculateIfReady: function(){
//            // Previews are not hidden unless they need to be (ie, unless the whole component has them nulled out.
//            // They'll be updated if necessary, and hidden when null or or user request
//            //this.clearPreviews();
//
//            // poll inputs to check status. Recalculate sufficiency, since this reflects a change in inputs
//            if (this._calculateSufficiency() === true) {
//                this.recalculate();
//            } else {
//                _.each(this.outputs,function(out){
//                    out.setNull(true);
//                });
//                this.clearPreviews();
//            }
//        },
//        _calculateSufficiency: function(){
//            var sufficient = true;
//
//            // next, verify that none of the inputs are nulled-out:
//            if (this._hasRequiredInputs === true){
//                _.each(this.inputs,function(input){
//                    if ((input.getTree().isEmpty() === true || input.isNull()) && input.required === true) {
//                        sufficient = false;
//                    }
//                });
//            }
//
//            // some output values, when inputs can come straight from the user (ie, numbers, booleans, functions), don't require any inputs
//            // However, in this case, the output value must be actually set before the component can be called sufficient
//            if (this.get('hasRequiredInputs') === false && _.isNull(this.getOutput().getTree())) {
//                sufficient = false;
//            }
//
//            // If an input is null, the output is null too, and no calculation should occur.
//            //if (!sufficient) this.output.setNull(true);
//            this.set({'sufficient': sufficient});
//
//            return sufficient;
//        },
        simulatedRecalculate: function(){
            // MUST REMAIN A NO-OP
            // if (!_.isUndefined(window.jasmine)) throw new Error("simulatedRecalculate is just for spying in jasmine.");
        },
        recalculate: function(){
            console.warn("DataFlow.Component.recalculate() was called directly. This method should be overridden for all component types.");
        },
        _recalculate: function(){
            // run whatever calculations are necessary, if all inputs are available
            console.warn(this.get('componentPrettyName')+ ' calls the deprecated method _recalculate()');
//            if (this.get('preview') === true) {
//                this.drawPreviews();
//            }
//
//            // if there's no data on the first output, consider the calculation a loss. This COULD cause some issue with some components, but
//            // is probably fine. Not sure if there's a better way to test this, even, without knowing specifically what that component is supposed
//            // to be doing
//            var firstOutputEmpty = this.getOutput().getTree().isEmpty();
//            _.each(this.outputs,function(out){
//                out.setNull(firstOutputEmpty);
//                //out.trigger('change');
//            });
        },
        fetchOutputs: function(){
            /* This function is stupid. It may be useful for writing tests, but it doesn't deal with the data trees in any useful way */
            return this.getOutput().getTree().flattenedTree().dataAtPath([0]);
        },
        getPreviewOutputs: function(){
            // Most components have a "primary" output which is previewable. However, some components might have multiple
            // or non-first previewable outputs, in which case this function can be overridden
            return [this.getOutput()];
        },
        drawPreviews: function(){
            var previewOutputs = this.getPreviewOutputs(); // plural, though components can't currently display more than one type
            var geom = previewOutputs[0].getTree().flattenedTree().dataAtPath([0]);
            var type = previewOutputs[0].type;
            var preview;

            if (type === ENUMS.OUTPUT_TYPES.WILD) {
                // extract type from the first piece of data. Discard mismatched data.
                if (geom[0].constructor === Geometry.Curve) {
                    type = ENUMS.OUTPUT_TYPES.CURVE;
                    geom = _.filter(geom,function(item){
                        return item.constructor === Geometry.Curve;
                    });
                } else if (geom[0].constructor === Geometry.Point) {
                    type = ENUMS.OUTPUT_TYPES.POINT;
                    geom = _.filter(geom,function(item){
                        return item.constructor === Geometry.Point;
                    });
                }
            }

            switch (type) {
                case ENUMS.OUTPUT_TYPES.POINT:
                        if (this.previews[0]) {
                            this.previews[0].updatePoints(geom);
                        } else {
                            this.previews[0] = new Preview.PointListPreview(geom);
                        }
                    break;
                
                case ENUMS.OUTPUT_TYPES.CURVE:
                        if (_.isArray(this.previews) && this.previews.length > 0) {
                            preview = this.previews[0];

                            // update the preview geometry
                            preview.updateCurveList(geom);
                            preview.show();
                        }
                        else {
                            preview = new Preview.CurveListPreview(geom);
                            this.previews = [preview];
                        }
                    break;
            
                default:
                        console.warn("UNPREVIEWABLE TYPE: " + type)
                    break;
            }


        },
        destroyPreviews: function(){
            // destroy prior views
            this.clearPreviews();
            this.previews.splice(0,this.previews.length); // make sure the previews can be deallocated. remove references.
        },
        clearPreviews: function(){
            // destroy prior views
            _.each(this.previews,function(prev){
                prev.hide();
            });
        },
        toJSON: function(){
            var inputData = [],
                outputData = [];
            _.each(this.inputs,function(ipt){
                inputData.push(ipt.toJSON());
            });
            _.each(this.outputs,function(out){
                outputData.push(out.toJSON());
            });

            return {
                componentPrettyName: this.attributes.componentPrettyName,
                componentName: this.componentName,
                position: this.position,
                preview: this.attributes.preview,
                inputs: inputData,
                outputs: outputData,
                id: this.id || this.cid
            };
        }
    });

    return component;

});