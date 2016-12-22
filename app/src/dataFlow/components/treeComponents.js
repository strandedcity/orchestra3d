define([
    "underscore",
    "dataFlow/core",
    "dataFlow/dataMatcher"
],function(_,DataFlow,DataMatcher){

    var components = {};

    components.GraftComponent = DataFlow.Component.extend({
        initialize: function(opts){
            //var output = new DataFlow.OutputMultiType();
            var output = this.createIObjectsFromJSON([
                {shortName: "T", type: DataFlow.OUTPUT_TYPES.WILD}
            ], opts, "output");

            //var inputs = [new DataFlow.OutputMultiType({required: true, shortName: "T"})];
            var inputs = this.createIObjectsFromJSON([
                {required: true, shortName: "T", type: DataFlow.OUTPUT_TYPES.WILD}
            ], opts, "inputs");

            var args = _.extend(opts || {},{
                inputs: inputs,
                outputs: output,
                componentPrettyName: "Graft"
            });
            this.base_init(args);
        },
        recalculate: function(){
            // Note that this component is a "wildcard" type output. One approach could maintain more data fidelity by forcing types to remain the same
            // per-component, but that requires a more complicated typing strategy on the way in and out of components that deal with the data trees directly.
            // This can always be added later, but it's not critical first-order functionality

            // grab the input, construct a new (grafted) tree.
            //this.getOutput("T").replaceData(this.getInput("T").getTree().graftedTree());

            // clearValues() should NOT try to destroy each object in the tree; the graft component just reorganizes the objects!
            this.getOutput("T").values = this.getInput("T").getTree().graftedTree();

            // Calling replaceData would call this automatically, but in this case we prefer not to call replaceData. See comment.
            this._recalculate();
        },
        _recalculate: function(){
            this.getOutput()._isNull = this.getOutput().getTree().isEmpty();
            this.getOutput().trigger("change");
        }
    });

    components.ShiftComponent = DataFlow.Component.extend({
        initialize: function(opts){
            //var output = new DataFlow.OutputMultiType({shortName: "L"});
            var output = this.createIObjectsFromJSON([
                {shortName: "L", type: DataFlow.OUTPUT_TYPES.WILD}
            ], opts, "output");

            //var inputData = new DataFlow.OutputMultiType({required: true, shortName: "L"}); // Data to shift
            //var shiftDir = new DataFlow.OutputNumber({required: false, shortName: "S", default: 1}); // Shift Direction
            //var wrap = new DataFlow.OutputBoolean({required: false, shortName: "W", default: true}); // wrap data?
            var inputs = this.createIObjectsFromJSON([
                {required: true, shortName: "L", type: DataFlow.OUTPUT_TYPES.WILD, interpretAs: DataFlow.INTERPRET_AS.LIST, isMaster: true},
                {required: false, shortName: "S", default: 1, type: DataFlow.OUTPUT_TYPES.NUMBER},
                {required: false, shortName: "W", default: true, type: DataFlow.OUTPUT_TYPES.BOOLEAN}
            ], opts, "inputs");

            var args = _.extend(opts || {},{
                inputs: inputs,
                outputs: output,
                componentPrettyName: "Shift"
            });
            this.base_init(args);
        },
        recalculate: function(){
            var result = DataMatcher([this.getInput("L"),this.getInput("S"),this.getInput("W")],function(listIn,shiftBy,wrap){
                var listOut = listIn.slice(shiftBy);
                if (wrap) listOut = listOut.concat(listIn.slice(0, shiftBy));
                return listOut;
            });

            this.getOutput("L").replaceData(result.tree);
        }
    });

    components.FlattenComponent = DataFlow.Component.extend({
        initialize: function(opts){
            //var output = new DataFlow.OutputMultiType({shortName: "L"});
            var output = this.createIObjectsFromJSON([
                {shortName: "T", type: DataFlow.OUTPUT_TYPES.WILD}
            ], opts, "output");

            //var inputData = new DataFlow.OutputMultiType({required: true, shortName: "L"}); // Data to shift
            //var shiftDir = new DataFlow.OutputNumber({required: false, shortName: "S", default: 1}); // Shift Direction
            //var wrap = new DataFlow.OutputBoolean({required: false, shortName: "W", default: true}); // wrap data?
            var inputs = this.createIObjectsFromJSON([
                {required: true, shortName: "T", type: DataFlow.OUTPUT_TYPES.WILD},
                {required: false, shortName: "P", default: [0], type: DataFlow.OUTPUT_TYPES.ARRAY}
            ], opts, "inputs");

            var args = _.extend(opts || {},{
                inputs: inputs,
                outputs: output,
                componentPrettyName: "Flatten"
            });
            this.base_init(args);
        },
        recalculate: function(){
            /* T=input Tree Data, P = (optional) path to put flattened data on (default is [0] */
            console.warn("PATH input is ignored for now");
            var flattened = this.getInput("T").getTree().flattenedTree(false); // makes a copy!
            this.getOutput("T").replaceData(flattened);
        }
    });

    components.ListItemComponent = DataFlow.Component.extend({
        initialize: function(opts){
            //var output = new DataFlow.OutputMultiType({shortName: "L"});
            var output = this.createIObjectsFromJSON([
                {shortName: "i", type: DataFlow.OUTPUT_TYPES.WILD}
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {required: true, shortName: "L", type: DataFlow.OUTPUT_TYPES.WILD, interpretAs: DataFlow.INTERPRET_AS.LIST},
                {required: false, shortName: "i", default: 0, type: DataFlow.OUTPUT_TYPES.NUMBER},
                {required: false, shortName: "W", default: true, type: DataFlow.OUTPUT_TYPES.BOOLEAN}
            ], opts, "inputs");

            var args = _.extend(opts || {},{
                inputs: inputs,
                outputs: output,
                componentPrettyName: "Item"
            });
            this.base_init(args);
        },
        recalculate: function(){
            /* L=input list, i=item to retrieve, W=wrap list */
            var result = DataMatcher([this.getInput("L"),this.getInput("i"),this.getInput("W")],function(list,item,wrap){
                if (!_.isArray(list)) return null;
                if (!wrap && list.length <= item) return null;

                // wrap is true, so we're going to return something! "wrapping" is easy, using a modulo
                return list[item % list.length];
            });

            this.getOutput("i").replaceData(result.tree);
        }
    });

    components.DuplicateDataComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "D", type: DataFlow.OUTPUT_TYPES.WILD}
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {required: true, shortName: "D", type: DataFlow.OUTPUT_TYPES.WILD, interpretAs: DataFlow.INTERPRET_AS.LIST}, // data (as list)
                {required: false, shortName: "N", default: 2, type: DataFlow.OUTPUT_TYPES.NUMBER}, // number of duplicates
                {required: false, shortName: "O", default: true, type: DataFlow.OUTPUT_TYPES.BOOLEAN} // retain list order
            ], opts, "inputs");

            var args = _.extend(opts || {},{
                inputs: inputs,
                outputs: output,
                componentPrettyName: "Dup"
            });
            this.base_init(args);
        },
        recalculate: function(){
            var result = DataMatcher([this.getInput("D"),this.getInput("N"),this.getInput("O")],function(data,numberOfDupes,retainOrder){
                if (!_.isArray(data)) return null;
                console.warn("RETAIN ORDER FALSE NOT SUPPORTED");
                
                var duppedList = [];
                for (var i=0; i<numberOfDupes; i++){
                    duppedList = duppedList.concat(data);
                }

                return duppedList;
            });

            console.warn("THIS IS A BAD CORNER TO CUT -- the function to return data 'as a list' should not live inside of .map()");
            this.getOutput("D").replaceData(result.tree.map(function(d){return d;}));
        }
    });

    components.ListLengthComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "L", type: DataFlow.OUTPUT_TYPES.NUMBER}
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {required: true, shortName: "L", type: DataFlow.OUTPUT_TYPES.WILD, interpretAs: DataFlow.INTERPRET_AS.LIST}, // data (as list)
            ], opts, "inputs");

            var args = _.extend(opts || {},{
                inputs: inputs,
                outputs: output,
                componentPrettyName: "Lng"
            });
            this.base_init(args);
        },
        recalculate: function(){
            var result = DataMatcher([this.getInput("L")],function(list){
                if (!_.isArray(list)) return null;
                
                return list.length;
            });

            this.getOutput("L").replaceData(result.tree);
        }
    });



    return components;
});

