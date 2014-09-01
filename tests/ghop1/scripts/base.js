var Ant = Ant || {};
var Output = Ant.Output = function AntOutput(opts){
    // Output objects are able to extract bits of information from a raw result pointer, via a passed-in function
    // This could be as simple as returning the array of pointers directly, or it could mean querying those objects
    // for some property and creating that array instead.
    var args = _.extend(opts || {}, {/* default args */});
    this.type = opts.type;
    this.values = [];
    this.referencedCPointer = null;
    if (_.isUndefined(this.type)) {throw new Error("No type specified for Output");}
//    this.initialize.apply(this, args);
};
_.extend(Output.prototype, Backbone.Events, {
    assignValues: function(valueArray){
        if (!_.isArray(valueArray)) {
            throw new Error("'Values' must be an array");
        }
        _.each(valueArray,function(v){
            if (typeof v !== "number") {throw new Error("Only Numeric values can be assigned directly. This includes ");}
        });
        this.values = valueArray;
        this.trigger('change');
    },
    fetchValues: function(){
        return this.values;
    },
    destroy: function(){
        if (!_.isUndefined(this.referencedCPointer)) {Module.Utils.freeCArrayAtPointer(this.referencedCPointer);}
    }
});

var Component = Ant.Component = function AntComponent(opts){
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
    },
    assignInput: function(inputName, input){
        if (_.isUndefined(inputName) || _.isUndefined(input)) {throw new Error("Unspecified Input");}
        if (!_.has(this.inputTypes,inputName)) {throw new Error("Tried to specify an input that does not exist");}
        if (this.inputTypes[inputName] !== input.type) {throw new Error("Tried to specify an input of the wrong type");}

        // Still here? Cool. Just listen to the output for change events.
        this.listenTo(input, 'change', this.recalculate);
        this.inputs[inputName] = input; // keep a ref
    },
    destroy: function(){
        this.stopListening();
        _.each(this.inputs,function(input){
            input.destroy();
        });
        delete this.inputs;
        this.output.destroy();
        delete this.output;
    },
    recalculate: function(){
        this._recalculate();
    },
    _recalculate: function(){
        // run whatever calculations are necessary, if all inputs are available
        console.log('recalculating BASE');
        this.output.trigger('change');
    }
});

console.warn("This stuff should be a separate dependency!!");
if (_.isUndefined(Module._newPoint)) console.warn("SISL routine newPoint is missing, but PointComponent depends on it.");
var newPoint = Module.cwrap('newPoint','number',['number','number','number']);
var SISL = {};

SISL.Point = function SISLPoint(x, y, z){
    // Construct C array of the point's coordinates. Optionally pass a 'pointer' to re-use C memory
    var coordsPointer = Module.Utils.copyJSArrayToC([x,y,z]);
    this._pointer = newPoint(coordsPointer,3,0);
    console.log('newPoint pointer: ',this._pointer);
//    console.log(coordsPointer, this._pointer);
//    this._pointer = coordsPointer;
};
_.extend(SISL.Point.prototype,{
    getPointer: function(){
        return this._pointer;
    },
    getCoords: function(){
        console.log('point pointer',this._pointer);
        var coordsPtr = Module.ccall('pointCoords','number',['number'],[this._pointer]);
        console.log('coords pointer',coordsPtr);
        return new Float32Array(Module.HEAPU8.buffer, coordsPtr, 3);
    },
    destroy: function(){
        Module._free(this._pointer);
    }
});





var PointComponent = Ant.PointComponent = function PointComponent(opts){
    this.initialize.apply(this, arguments);
};

_.extend(PointComponent.prototype, Component.prototype,{
    initialize: function(opts){
        var output = new Ant.Output({type: 'SISLPoint'});

        var args = _.extend(opts || {},{
            inputTypes: {
                "X": 'number',
                "Y": 'number',
                "Z": 'number'
            },
            output: output,
            resultFunction: this.recalculate
        });
        this.base_init(args);
    },
    shortestInputLength: function(){
        var shortestIpt = _.min(this.inputs,function(ipt){return ipt.values.length;});
        return shortestIpt.values.length;
    },
    recalculate: function(){
        console.log("TODO: CALCULATE SISLPOINT!",this.shortestInputLength());
        var that = this;
        for (var i=0; i < this.shortestInputLength(); i++) {
            //SISLPoint *newPoint (double *ecoef, int idim, int icopy)
            var point = new SISL.Point(
                this.inputs["X"].values[i],
                this.inputs["Y"].values[i],
                this.inputs["Z"].values[i]
            );
            console.log(point.getCoords());
//            console.log('POINTER: ',pointer);
//            console.log("Has the curve already been allocated? Free it and replace it, or just reuse the memory");
//            console.log("Allocate a new curve object into memory, execute 'newcurve' function in C using inputs at this index, store pointer in output.values array");
            that.output.values.push(point);
        }

        this._recalculate();
    }
});


