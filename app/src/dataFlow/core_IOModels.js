define([
    "underscore",
    "backbone",
    "dataFlow/dataTree",
    "dataFlow/enums"
],function(_,Backbone,DataTree, ENUMS){


    var output = Backbone.Model.extend({
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
                    parameterType = ENUMS.INTERPRET_AS[args.interpretAs];
                }
            }
            this.interpretAs = parameterType;

            // restore user-saved values to the component
            if (!_.isUndefined(args._persistedData)) {
                this.assignValues(args._persistedData);
            }
        },
        assignValues: function(values, forPath){
            /* This function stores user-entered data directly. When saved, the output will store these values in JSON format */
            if (!_.isArray(values)) {
                this.setNull(true);
                throw new Error("'Values' must be an array");
            }
            _.each(values,function(v){
                if (typeof v !== "number" && typeof  v !== "boolean") {throw new Error("Only Numeric & Boolean values can be assigned directly.");}
            });

            // store data
            this.values.addChildAtPath(values,forPath || [0],true);
            this._persistedData = values.slice(0);
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
            // for each connected input, trigger disconnection
            this.setNull(true);
            this.disconnectAll();
            this.trigger('disconnectAll',this); // completely remove the input
            this.clearValues();
            this.stopListening();
        },
        validateOutput: function(outputModel){
            // for inputs only, supports the data-flow attachment mechanism
            var wild = ENUMS.OUTPUT_TYPES.WILD;
            if (this.type !== outputModel.type && this.type !== wild && outputModel.type !== wild) { throw new Error("Incongruent output connected to an input"); }

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
        disconnectOutput: function(outputModel){
            this.stopListening(outputModel);
            //outputModel["connectedInputs"] = _.without(outputModel["connectedInputs"], outputModel);
            this.trigger("disconnectedOutput", outputModel);
            this.trigger("change");
        },
        disconnectAll: function(){
            // For inputs
            var that = this;
            if (!_.isUndefined(this._listeningTo)) {
                _.each(this._listeningTo,function(outputModel){
                    that.disconnectOutput.call(that,outputModel);
                });
            }
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
        toJSON: function(){
            var obj = {
                shortName: this.shortName,
                id: this.id || this.cid,
                connections: _.map(this._listeningTo,function(output){
                    return output.id || output.cid;
                }),
                type: this.type
            };

            if (!_.isUndefined(this._persistedData)) {
                obj._persistedData = this._persistedData;
            }

            return obj;
        }


    });

    return {
        Output: output
    }

});