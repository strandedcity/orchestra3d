define([
    "underscore",
    "dataFlow/core",
    "dataFlow/dataMatcher"
],function(_,DataFlow,DataMatcher){

    var components = {};

    components.GraftComponent = DataFlow.Component.extend({
        initialize: function(opts){
            this.base_init(
                _.extend({
                    preview: false,
                    componentPrettyName: "Graft"
                }, opts || {},{
                    inputs: this.createIObjectsFromJSON([
                                {required: true, shortName: "T", type: DataFlow.OUTPUT_TYPES.WILD}
                            ], opts, "inputs"),
                    outputs: this.createIObjectsFromJSON([
                                {shortName: "T", type: DataFlow.OUTPUT_TYPES.WILD}
                            ], opts, "output")
                })
            );
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
    },{
        "label": "Graft Tree",
        "desc": "Creates a separate branch for each data item in the supplied tree"
    });

    components.ShiftComponent = DataFlow.Component.extend({
        initialize: function(opts){
            this.base_init(
                _.extend({
                    preview: false,
                    componentPrettyName: "Shift"
                }, opts || {},{
                    inputs: this.createIObjectsFromJSON([
                                {required: true, shortName: "L", type: DataFlow.OUTPUT_TYPES.WILD, interpretAs: DataFlow.INTERPRET_AS.LIST, isMaster: true},
                                {required: false, shortName: "S", default: 1, type: DataFlow.OUTPUT_TYPES.NUMBER},
                                {required: false, shortName: "W", default: true, type: DataFlow.OUTPUT_TYPES.BOOLEAN}
                            ], opts, "inputs"),
                    outputs: this.createIObjectsFromJSON([
                                {shortName: "L", type: DataFlow.OUTPUT_TYPES.WILD}
                            ], opts, "output")
                })    
            );
        },
        recalculate: function(){
            var result = DataMatcher([this.getInput("L"),this.getInput("S"),this.getInput("W")],function(listIn,shiftBy,wrap){
                var listOut = listIn.slice(shiftBy);
                if (wrap) listOut = listOut.concat(listIn.slice(0, shiftBy));
                return listOut;
            });

            this.getOutput("L").replaceData(result.tree);
        }
    },{
        "label": "Shift List",
        "desc": "Removes items from the beginning of a data list, and optionally tacks them back onto the end"
    });

    components.CullIndexComponent = DataFlow.Component.extend({
        initialize: function(opts){
            this.base_init(
                _.extend({
                    preview: false,
                    componentPrettyName: "Cull i"
                }, opts || {},{
                    inputs: this.createIObjectsFromJSON([
                                {required: true, shortName: "L", type: DataFlow.OUTPUT_TYPES.WILD, interpretAs: DataFlow.INTERPRET_AS.LIST, isMaster: true, desc: "List to Cull"},
                                {required: true, shortName: "i", type: DataFlow.OUTPUT_TYPES.NUMBER, interpretAs: DataFlow.INTERPRET_AS.LIST, desc: "Culling indices"},
                                {required: false, shortName: "W", default: true, type: DataFlow.OUTPUT_TYPES.BOOLEAN, desc: "Wrap indices to list range"}
                            ], opts, "inputs"),
                    outputs: output = this.createIObjectsFromJSON([
                                {shortName: "L", type: DataFlow.OUTPUT_TYPES.WILD}
                            ], opts, "output")
                })
            );
        },
        recalculate: function(){
            console.warn("TODO: Support 'wrap' option on cull-index component");
            var result = DataMatcher([this.getInput("L"),this.getInput("i"),this.getInput("W")],function(listIn,cullIndices,wrap){
                var listOut = [];
                _.each(listIn,function(val,idx){
                    if (!_.contains(cullIndices,idx)) {
                        listOut.push(val);
                    }
                })
                return listOut;
            });

            this.getOutput("L").replaceData(result.tree);
        }
    },{
        "label": "Cull Index",
        "desc": "Cull (remove) indexed elements from a list"
    });

    components.CullPatternComponent = DataFlow.Component.extend({
        initialize: function(opts){
            this.base_init(
                _.extend({
                    preview: false,
                    componentPrettyName: "Cull"
                }, opts || {},{
                    inputs: this.createIObjectsFromJSON([
                                {required: true, shortName: "L", type: DataFlow.OUTPUT_TYPES.WILD, interpretAs: DataFlow.INTERPRET_AS.LIST, isMaster: true, desc: "List to Cull"},
                                {required: true, shortName: "P", type: DataFlow.OUTPUT_TYPES.BOOLEAN, interpretAs: DataFlow.INTERPRET_AS.LIST, desc: "Culling pattern"}
                            ], opts, "inputs"),
                    outputs: output = this.createIObjectsFromJSON([
                                {shortName: "L", type: DataFlow.OUTPUT_TYPES.WILD}
                            ], opts, "output")
                })
            );
        },
        recalculate: function(){
            var result = DataMatcher([this.getInput("L"),this.getInput("P")],function(listIn,cullPattern){
                var len = cullPattern.length;
                return _.filter(listIn,function(val,idx){
                    // figure out which item in the cull pattern this index aligns to. There can be more items in listIn, in which case
                    // the culling pattern should repeat
                    return cullPattern[idx % len]
                });
            });

            this.getOutput("L").replaceData(result.tree);
        }
    },{
        "label": "Cull Pattern",
        "desc": "Cull (remove) indexed elements from a list using a repeating bit mask"
    });


    components.CullFrequencyComponent = DataFlow.Component.extend({
        initialize: function(opts){
            this.base_init(
                _.extend({
                    componentPrettyName: "CullN",
                    preview: false
                }, opts || {},{
                    inputs: this.createIObjectsFromJSON([
                                {required: true, shortName: "L", type: DataFlow.OUTPUT_TYPES.WILD, interpretAs: DataFlow.INTERPRET_AS.LIST, isMaster: true, desc: "List to Cull"},
                                {required: false, default: 2, shortName: "N", type: DataFlow.OUTPUT_TYPES.NUMBER, desc: "Cull frequency"}
                            ], opts, "inputs"),
                    outputs: output = this.createIObjectsFromJSON([
                                {shortName: "L", type: DataFlow.OUTPUT_TYPES.WILD}
                            ], opts, "output")
                })
            );
        },
        recalculate: function(){
            var result = DataMatcher([this.getInput("L"),this.getInput("N")],function(listIn,frequency){
                return _.filter(listIn,function(val,idx){
                    // figure out which item in the cull pattern this index aligns to. There can be more items in listIn, in which case
                    // the culling pattern should repeat
                    return idx % frequency === 0;
                });
            });

            this.getOutput("L").replaceData(result.tree);
        }
    },{
        "label": "Cull Nth",
        "desc": "Cull (remove) every Nth element in a list"
    });

    components.InsertItemsComponent = DataFlow.Component.extend({
        initialize: function(opts){
            this.base_init(
                _.extend({
                    preview: false,
                    componentPrettyName: "Ins"
                }, opts || {},{
                    inputs: this.createIObjectsFromJSON([
                                {required: true, shortName: "L", type: DataFlow.OUTPUT_TYPES.WILD, interpretAs: DataFlow.INTERPRET_AS.LIST, isMaster: true, desc: "List to modify"},
                                {required: true, shortName: "I", type: DataFlow.OUTPUT_TYPES.WILD, interpretAs: DataFlow.INTERPRET_AS.LIST, isMaster: true, desc: "Items to insert. If no items are supplied, nulls will be inserted"},
                                {required: true, shortName: "i", type: DataFlow.OUTPUT_TYPES.NUMBER, interpretAs: DataFlow.INTERPRET_AS.LIST, desc: "Insertion index for each item"},
                                {required: false, shortName: "W", default: true, type: DataFlow.OUTPUT_TYPES.BOOLEAN, desc: "If true, indices will be wrapped"}
                            ], opts, "inputs"),
                    outputs: output = this.createIObjectsFromJSON([
                                {shortName: "L", type: DataFlow.OUTPUT_TYPES.WILD}
                            ], opts, "output")
                })
            );
        },
        recalculate: function(){
            console.warn("TODO: Support 'wrap' option on insert-items component");
            
            // Ghop behavior: insert items starting at the end of the list. 
            // Ie, if you enter data [1,2] and indices [0,0], you'll get output [1,2] not [2,1]
            var result = DataMatcher([this.getInput("L"),this.getInput("I"),this.getInput("i"),this.getInput("W")],function(listIn,insertItems,indices,wrap){
                var listOut = listIn.slice(0);
                var reversedItems = insertItems.slice(0).reverse();
                _.each(indices.slice(0).reverse(),function(indexValue,itemPosition){
                    listOut.splice(indexValue, 0, reversedItems[itemPosition]);
                });
                return listOut;
            });

            this.getOutput("L").replaceData(result.tree);
        }
    },{
        "label": "Insert Items",
        "desc": "Insert a collection of items into a list"
    });

    components.FlattenComponent = DataFlow.Component.extend({
        initialize: function(opts){
            this.base_init(
                _.extend({
                    preview: false,
                    componentPrettyName: "Flatten"
                }, opts || {},{
                    inputs: this.createIObjectsFromJSON([
                                {required: true, shortName: "T", type: DataFlow.OUTPUT_TYPES.WILD},
                                {required: false, shortName: "P", default: [0], type: DataFlow.OUTPUT_TYPES.ARRAY}
                            ], opts, "inputs"),
                    outputs: this.createIObjectsFromJSON([
                                {shortName: "T", type: DataFlow.OUTPUT_TYPES.WILD}
                            ], opts, "output")
                })
            );
        },
        recalculate: function(){
            /* T=input Tree Data, P = (optional) path to put flattened data on (default is [0] */
            console.warn("PATH input is ignored for now");
            var flattened = this.getInput("T").getTree().flattenedTree(false); // makes a copy!
            this.getOutput("T").replaceData(flattened);
        }
    },{
        "label": "Flatten Tree Data",
        "desc": "Flatten a data tree by removing all branching information"
    });

    components.ListItemComponent = DataFlow.Component.extend({
        initialize: function(opts){
            this.base_init(
                _.extend({
                    preview: false,
                    componentPrettyName: "Item"
                }, opts || {},{
                    inputs: this.createIObjectsFromJSON([
                                {required: true, shortName: "L", type: DataFlow.OUTPUT_TYPES.WILD, interpretAs: DataFlow.INTERPRET_AS.LIST},
                                {required: false, shortName: "i", default: 0, type: DataFlow.OUTPUT_TYPES.NUMBER},
                                {required: false, shortName: "W", default: true, type: DataFlow.OUTPUT_TYPES.BOOLEAN}
                            ], opts, "inputs"),
                    outputs: this.createIObjectsFromJSON([
                                {shortName: "i", type: DataFlow.OUTPUT_TYPES.WILD}
                            ], opts, "output")
                })    
            );
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
    },{
        "label": "Extract Item from List",
        "desc": "Retrieve a specific item from a list"
    });

    components.DuplicateDataComponent = DataFlow.Component.extend({
        initialize: function(opts){
            this.base_init(
                _.extend({
                    preview: false,
                    componentPrettyName: "Dup"
                }, opts || {},{
                    inputs: this.createIObjectsFromJSON([
                                {required: true, shortName: "D", type: DataFlow.OUTPUT_TYPES.WILD, interpretAs: DataFlow.INTERPRET_AS.LIST}, // data (as list)
                                {required: false, shortName: "N", default: 2, type: DataFlow.OUTPUT_TYPES.NUMBER}, // number of duplicates
                                {required: false, shortName: "O", default: true, type: DataFlow.OUTPUT_TYPES.BOOLEAN} // retain list order
                            ], opts, "inputs"),
                    outputs: this.createIObjectsFromJSON([
                                {shortName: "D", type: DataFlow.OUTPUT_TYPES.WILD}
                            ], opts, "output")
                })
            );
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
    },{
        "label": "Duplicate Data",
        "desc": "Duplicate data a predefined number of times"
    });

    components.ListLengthComponent = DataFlow.Component.extend({
        initialize: function(opts){
            this.base_init(
                _.extend({
                    preview: false,
                    componentPrettyName: "Lng"
                }, opts || {},{
                    inputs: this.createIObjectsFromJSON([
                                {required: true, shortName: "L", type: DataFlow.OUTPUT_TYPES.WILD, interpretAs: DataFlow.INTERPRET_AS.LIST}, // data (as list)
                            ], opts, "inputs"),
                    outputs: this.createIObjectsFromJSON([
                                {shortName: "L", type: DataFlow.OUTPUT_TYPES.NUMBER}
                            ], opts, "output")
                })
            );
        },
        recalculate: function(){
            var result = DataMatcher([this.getInput("L")],function(list){
                if (!_.isArray(list)) return null;
                
                return list.length;
            });

            this.getOutput("L").replaceData(result.tree);
        }
    },{
        "label": "List Length",
        "desc": "Measure the length of a List"
    });



    return components;
});

