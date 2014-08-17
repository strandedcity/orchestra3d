var Ant = Ant || {};
var Output = Ant.Output = function(opts){
    // Output objects are able to extract bits of information from a raw result pointer, via a passed-in function
    // This could be as simple as returning the array of pointers directly, or it could mean querying those objects
    // for some property and creating that array instead.
    this.options = opts || {};
    this.initialize.apply(this, arguments);
};
_.extend(Output.prototype, Backbone.Events, {
    retrieve: function(){
        if (!_.isUndefined(this.options.retrieve)) {
            return this.options.re
        }
    }
});

var Component = Ant.Component = function(opts){
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
    if (_.isUndefined(opts) || _.isUndefined(opts.inputs) || _.isUndefined(opts.resultFunction) || _.isUndefined(opts.outputs) ) {
        throw new Error("Insufficient specifications for a Component");
    }

    // Inputs and outputs are arrays of Ant.Inputs and Ant.Outputs
    this.inputs = opts.inputs;
    this.outputs = opts.outputs;
    this.resultFunction = opts.resultFunction;

    this.resultArray = []; // Contains raw result object pointers after async calculation completes.
    this.initialize.apply(this, arguments);
};

// Mix in backbone events so this component can interact with other components
_.extend(Component.prototype, Backbone.Events);