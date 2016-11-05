define([
    "underscore",
    "backbone",
    "dataFlow/dataTree",
    "dataFlow/enums",
    "dataFlow/pulse"
],function(_,Backbone,DataTree, ENUMS, Pulse){


    var io = Backbone.Model.extend({
        defaults: function(){
            return {
                persistedData: new DataTree(),
                invisible: false,
                isNull: true
            }
        },
        initialize: function(opts){
            // Output objects are able to extract bits of information from a raw result pointer, via a passed-in function
            // This could be as simple as returning the array of pointers directly, or it could mean querying those objects
            // for some property and creating that array instead.
            var args = _.extend(opts || {}, {/* default args */});
            if (_.isUndefined(args.type)) {throw new Error("No type specified for Output");}
            if (!_.has(_.values(ENUMS.OUTPUT_TYPES), args.type)) {throw new Error("Invalid Output Type Specified: "+args.type);}
            if (_.isUndefined(args.shortName)) {throw new Error("No shortName specified for Output");}

            this.required = _.isUndefined(args.required) ? true : args.required;
            this.type = args.type;
            this.default = _.isUndefined(args.default) ? null : args.default; // store default value if spec'd
            this.shortName = args.shortName;
            this.values = new DataTree([]);
            if (!_.isUndefined(args.invisible)) this.set({"invisible": args.invisible});

            var parameterType = ENUMS.INTERPRET_AS.ITEM;
            if (!_.isUndefined(args.interpretAs)) {
                if (!_.has(_.keys(ENUMS.INTERPRET_AS), args.interpretAs)) {
                    console.warn("Invalid list interpretation type passed to an input. Using default ITEM interpretation. See ENUMS.INTERPRET_AS");
                } else {
                    parameterType = args.interpretAs;
                }
            }
            this.interpretAs = parameterType;

            // restore user-saved values to the component
            if (!_.isUndefined(args.persistedData)) {
                var tree = new DataTree();
                tree.fromJSON(args.persistedData);
                this.assignPersistedData(tree);
            }

            if (typeof this._initialize === "function") {
                this._initialize();
            }
        },
        replaceData: function(dataTree){
            if (dataTree.constructor.name !== "DataTree") {
                throw new Error("Attempt to replace Data Tree with something that's not a Data Tree.");
            }
            this.clearValues();
            this.values = dataTree;
        },
        assignPersistedData: function(tree){
            throw new Error("Cannot call assignPersistedData() on base io class");
        },
        getTree: function(){
            /* Returns data on this node in correct precedence:
            1) Tree inherited from any connected outputs
            2) User-entered data ie, "persistedData"
            3) Default value
            4) No data
             */

            if (this.hasConnectedOutputs()) {
                // are there connected outputs? use those.
                return this.applyTreeTransform(this.values);
            } else if (!_.isUndefined(this.get('persistedData')) && !this.get('persistedData').isEmpty()) {
                // no connected outputs, but there IS user-entered data. Use that.
                return this.applyTreeTransform(this.get('persistedData'));
            } else if (!_.isNull(this.default)) {
                // no connected outputs OR user-entered data, but there IS a default. use that.
                var t = new DataTree();
                t.setDataAtPath([0],[this.default]);
                return t;
            } else {
                // no data sources available, but something is polling for data
                return new DataTree();
            }
        },
        applyTreeTransform: function(tree){
            // TODO: Apply transformations, such as graft or flatten
            return tree.copy();
        },
        getDefaultValue: function(){
            console.warn("getDefaultValue() is deprecated. Use getTree() instead, but assume that the default value will appear inside a data tree.");
            return this.default;
        },
        getFirstValueOrDefault: function(){
            // getTree() now takes care of the "or default" part of this logic -- the tree returned by getTree() will
            // reveal default values if no data sources with greater precedence are available
            return this.getTree().dataAtPath([0])[0];
        },
        clearValues: function(){
            this.values.recurseTree(function(data,node){
                _.each(data, function(object){
                    // critical to manually free emscripten memory. Test by cyclically destroying a single curve. The pointer will be the same each time
                    // if memory is being cleared out appropriately. log(geocurve._pointer) to see it in action
                    if (!_.isNull(object) && typeof object.destroy === "function") object.destroy();
                    else if (!_.isNull(object) && !_.isNumber(object) && !_.isArray(object)) {
                        console.warn("Can't destroy object type: " + typeof object + " / constructor: " + object.constructor.name);
                    }
                });
                node.data = []; // clear out all values
            });
        },
        _destroy: function(){
            // for each connected input, trigger disconnection

            this.disconnectAll();
            this.stopListening();
        },
        toJSON: function(){
            var obj = {
                shortName: this.shortName,
                id: this.id || this.cid,
                connections: _.map(this._listeningTo,function(output){
                    return output.id || output.cid;
                }),
                type: this.type
            };

            if (!_.isUndefined(this.get('persistedData')) && !this.get('persistedData').isEmpty()) {
                obj.persistedData = this.get('persistedData').toJSON();
            }

            return obj;
        }
    });













    // INPUTS are unique because they store CONNECTIONS to outputs, can store user-defined data, and know how to
    // figure out if they are "full" ie, if they can provide data to connected outputs or not.
    var input = io.extend({
        modelType: "Input",
        validateOutput: function(outputModel){
            // for inputs only, supports the data-flow attachment mechanism
            var wild = ENUMS.OUTPUT_TYPES.WILD;
            if (this.type !== outputModel.type && this.type !== wild && outputModel.type !== wild) { throw new Error("Incongruent output connected to an input"); }

            return true;
        },
        connectOutput: function(outputModel){
            // remove prior connections first
            this.disconnectAll(true);

            // make the new connection
            try {
                if (this.validateOutput(outputModel) === true) this.stopListening();
                this.connectAdditionalOutput(outputModel, false);
            } catch (e){
                this.triggerChange(this.newPulseObject()); // if the new connection fails, we still need to trigger a "change" event since all connections were silently dropped above.
                console.warn('Caught an error during connection: ', e.message, e.stack);
            }
        },
        disconnectOutput: function(outputModel, silent){
            this.stopListening(outputModel);
            this.trigger("disconnectedOutput", outputModel);
            if (silent !== true) this.triggerChange(this.newPulseObject());
        },
        disconnectAll: function(silent){
            // For inputs
            var that = this;
            _.each(_.clone(this._listeningTo),function(outputModel){
                that.disconnectOutput.call(that,outputModel, true);
            });
            if (silent !== true) {
                this.triggerChange(); // once after all outputs disconnected
                this.trigger("disconnectAll",this); // completely remove the input
            }
        },
        processIncomingChange: function(pulse){
            // In a simple world, an input can only be connected to one output, so it would inherit that
            // output's values directly. However, an input can be attached to multiple outputs, so it needs to
            // harvest and combine those output's values into a single data tree.

            // Step through each connected output model. For each model, append data to the same branch of the tree
            var treeCreated = false,
                that = this;
            _.each(this._listeningTo,function(outputModel){
                if (treeCreated === false) {
                    that.values = outputModel.values.copy();
                    treeCreated = true;
                } else {
                    // ADD this model's data to the end of each path in the tree
                    outputModel.values.recurseTree(function(data,node){
                        var path = node.getPath(),
                            existingData = that.values.dataAtPath(path),
                            newData = existingData.concat(data);
                        that.values.setDataAtPath(path,newData);
                    });
                }
            });

            this.trigger("pulse",pulse);
        },
        connectAdditionalOutput: function(outputModel, validateModels){
            if (validateModels !== false) this.validateOutput(outputModel);

            var that=this;

            // Is this input already connected to outputModel ? If so, disconnect it first, then reconnect
            // This guarantees that the inputs stay in the right order, I think.
            _.each(this._listeningTo,function(o){
                if (outputModel === o) {
                    that.disconnectOutput.call(that,o);
                }
            });

            this.listenTo(outputModel, "pulse", function(pulse){
                that.processIncomingChange.call(that,pulse);
            });

            // "connections" live entirely on INPUT objects, but still need to be removed when the connected OUTPUT objects are removed
            this.listenTo(outputModel,"disconnectAll",function(outputModel){
                that.disconnectOutput.call(that,outputModel);
            });

            this.set({isNull: false},{silent: true}); // unset the "null" override
            //outputModel.triggerChange(); // check for completed flow on hookup

            // duplicates trigger('pulse',pulse) above... pretty sure this would result in multiple recalcs
            //outputModel.triggerChange(this.newPulseObject(),true);// There's a newly connected output. Make sure the change trickles through all "downstream" components
            this.trigger("connectedOutput", outputModel);
        },
        assignPersistedData: function(tree){
            //propagateChange.call();
            //
            //function propagateChange(){
                // Persisted data is independent of "connected" data... so we assign each branch of it normally, but keep an un-altered copy
                // of the tree to be serialized later
                var dataTree = tree;
                if (_.isArray(tree)) {
                    dataTree = new DataTree();
                    dataTree.setDataAtPath([0],tree);
                }

                this.set('persistedData',dataTree);
                this.set({isNull: false},{silent: true}); // unset the "null" override

                // Change events on THIS input should trigger when new persisted data is assigned AND
                // there are no connected outputs that are providing data with higher precedence.
                // Otherwise, no change-trigger necessary, since the data this input provides will not have changed.
//                if (!this.hasConnectedOutputs()) {
//                    this.trigger("change");
//                }

                this.trigger('pulse', new Pulse({startPoint: this}));
            //}
        },
        hasConnectedOutputs: function(){
            if (_.keys(this._listeningTo).length === 0) return false;

            // it only counts as a connection if we're getting non-null data
            var foundNonEmptyConnection = false;
            _.each(_.clone(this._listeningTo),function(outputModel){
                // There are two ways that a connected output would not be counted:
                if (outputModel.getTree().isEmpty() === false && outputModel.isNull() === false) {
                    foundNonEmptyConnection = true;
                }
            });

            return foundNonEmptyConnection;
        },
        destroy: function(){
            // custom INPUT destroy stuff

            this._destroy();
        }
    });












    // OUTPUTS are unique because they know if they are null or not. They can't store user-defined data, so their
    // null status comes directly from the presence or absence of data
    var output = io.extend({
        _initialize: function(){
            this.set({isNull: true});
        },
        modelType: "Output",
        destroy: function(){
            // custom OUTPUT destroy stuff
            // Slightly involved, since the connections TO THIS OUTPUT are actually stored on INPUT OBJECTS, not on "this"

            this.clearValues();
            this.setNull(true);
            this._destroy();
        },
        disconnectAll: function(){
            // For outputs
            this.trigger("disconnectAll",this); // completely remove the input
        },
        assignValues: function(values, forPath){
            // THIS FUNCTION IS FOR TESTING ONLY! IT ALLOWS THE CREATION OF 'MOCK' OUTPUT OBJECTS.
            // USE OUTSIDE OF THIS SCENARIO INDICATES INCORRECT CODE, PROBABLY FROM TRYING TO SET
            // 'USER-DATA' WITH THE WRONG METHOD. SET USER DATA ON INPUTS ONLY, USING 'ASSIGNPERSISTEDDATA'

            if (window.jasmine === "undefined") throw new Error("Use of assignValues() on an OUTPUT outside a JavaScript Test Indicates a mistake. Use assignPersistedData on an INPUT instead.");
            if (!_.isArray(values)) throw new Error("'Values' must be an array");

            _.each(values,function(v){
                if (typeof v !== "number" && typeof  v !== "boolean") {throw new Error("Only Numeric & Boolean values can be assigned directly.");}
            });

            // store data
            this.values.addChildAtPath(values,forPath || [0],true);

            this.trigger("pulse",new Pulse({startPoint: this}));
        },
        assignPersistedData: function(dataTree){

            // Persisted data is independent of "connected" data... so we assign each branch of it normally, but keep an un-altered copy
            // of the tree to be serialized later
            this.set('persistedData',dataTree);
            this.set({isNull: false},{silent: true}); // unset the "null" override

            // When persistedData is assigned to an OUTPUT, it means the component exists only so users can enter data
            // (eg, a slider). So entering persistedData in this context ALWAYS means a change: no precedence rules apply
            this.trigger("pulse",new Pulse({startPoint: this}));
        },

        // "null" status is unique to OUTPUTS. An INPUT connected to a NULL OUTPUT is not necessarily null --
        // it could have a default value or 'persisted data' that allows it to provide values while disconnected.
        setNull: function(val){
            // suppress null changes when the io is ALREADY NULL, no matter what.
            // If being set to NOT NULL, a change will be triggered already by the data that caused the change in null status
            var silent = this.isNull() === true;
            this.set({isNull: val},{silent: silent});
        },
        isNull: function(){
            return this.get('isNull') === true || this.getTree().isEmpty();
        },
        hasConnectedOutputs: function(){
            // the data on OUTPUTS is set by components -- there's only one data source, not several as is the case for inputs
            return true;
        }
    });

    return {
        Output: output,
        Input: input
    }

});