define([
    "underscore",
    "backbone",
    "dataFlow/dataTree",
    "dataFlow/enums"
],function(_,Backbone,DataTree, ENUMS){


    var io = Backbone.Model.extend({
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
            this._isNull = true;

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
        },
        assignValues: function(values, forPath){
            /* This function stores user-entered data directly. When saved, the output will store these values in JSON format */
            if (!_.isArray(values)) {
                this._isNull = true;
                throw new Error("'Values' must be an array");
            }
            _.each(values,function(v){
                if (typeof v !== "number" && typeof  v !== "boolean") {throw new Error("Only Numeric & Boolean values can be assigned directly.");}
            });

            // store data
            this.values.addChildAtPath(values,forPath || [0],true);
            this._isNull = this.values.isEmpty();

            this.trigger('change');
        },
        assignPersistedData: function(tree){
            // Persisted data is independent of "connected" data... so we assign each branch of it normally, but keep an un-altered copy
            // of the tree to be serialized later
            var that = this;
            this.set('persistedData',tree);
            tree.recurseTree(function(data,node){
                that.values.setDataAtPath(node.getPath(),data); // set manually to avoid triggering excessive downstream recalculations
            });
            this._isNull = this.values.isEmpty(); // we want to trigger a change event regardless of change of null status
            this.trigger("change");
        },
        replaceData: function(dataTree){
            if (dataTree.constructor.name !== "DataTree") {
                throw new Error("Attempt to replace Data Tree with something that's not a Data Tree.");
            }
            this.clearValues();
            this.values = dataTree;
            this._isNull = this.values.isEmpty();

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
            this.setNull(true);
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

            if (!_.isUndefined(this.get('persistedData'))) {
                obj.persistedData = this.get('persistedData').toJSON();
            }

            return obj;
        }
    });

    // CONNECTIONS are stored only on inputs, so there are a few custom methods here:
    var input = io.extend({
        validateOutput: function(outputModel){
            // for inputs only, supports the data-flow attachment mechanism
            var wild = ENUMS.OUTPUT_TYPES.WILD;
            if (this.type !== outputModel.type && this.type !== wild && outputModel.type !== wild) { throw new Error("Incongruent output connected to an input"); }

            return true;
        },
        connectOutput: function(outputModel){
            // remove prior connections first
            var that = this;
            _.each(_.clone(this._listeningTo),function(outputModel){
                that.disconnectOutput.call(that,outputModel);
            });

            // make the new connection
            try {
                if (this.validateOutput(outputModel) === true) this.stopListening();
                this.connectAdditionalOutput(outputModel, false);
            } catch (e){
                console.warn('Caught an error during connection: ', e.message, e.stack);
            }
        },
        disconnectOutput: function(outputModel){
            this.stopListening(outputModel);
            this.trigger("disconnectedOutput", outputModel);
            this.trigger("change");
        },
        disconnectAll: function(){
            // For inputs
            var that = this;
            _.each(_.clone(this._listeningTo),function(outputModel){
                that.disconnectOutput.call(that,outputModel);
            });
            this.trigger('disconnectAll',this); // completely remove the input
        },
        connectAdditionalOutput: function(outputModel, validateModels){
            if (validateModels !== false) this.validateOutput(outputModel);

            var that=this;
            this.listenTo(outputModel, "change",function(){
                that.values = outputModel.values;
                that._isNull = outputModel._isNull;
                that.trigger("change");
            });

            // "connections" live entirely on INPUT objects, but still need to be removed when the connected OUTPUT objects are removed
            this.listenTo(outputModel,"disconnectAll",function(outputModel){
                that.disconnectOutput.call(that,outputModel);
            });
            outputModel.trigger("change"); // check for completed flow on hookup
            this.trigger("connectedOutput", outputModel);
        },
        destroy: function(){
            // custom INPUT destroy stuff

            this._destroy();
        }
    });

    var output = io.extend({
        destroy: function(){
            // custom OUTPUT destroy stuff
            // Slightly involved, since the connections TO THIS OUTPUT are actually stored on INPUT OBJECTS, not on "this"

            this.clearValues();
            this._destroy();
        },
        disconnectAll: function(){
            // For outputs
            this.trigger('disconnectAll',this); // completely remove the input
        }
    });

    return {
        Output: output,
        Input: input
    }

});