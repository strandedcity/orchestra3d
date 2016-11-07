define([
    "underscore",
    "dataFlow/core",
    "dataFlow/dataTree",
    "dataFlow/dataMatcher"
],function(_,DataFlow,DataTree,DataMatcher){
    var components = {};

    components.NumberComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "N", type: DataFlow.OUTPUT_TYPES.NUMBER}
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {required: false, shortName: "N", type: DataFlow.OUTPUT_TYPES.NUMBER}
            ], opts, "inputs");

            var args = _.extend(opts || {},{
                inputs: inputs,
                output: output,
                componentPrettyName: "Number"
            });
            this.base_init(args);
        },
        recalculate: function(){
            this.getOutput("N").replaceData(this.getInput("N").getTree().copy());
        }
    });

    components.SeriesComponent = DataFlow.Component.extend({
        initialize: function(opts){
            //var output = new DataFlow.OutputNumber({shortName: "S"});
            var output = this.createIObjectsFromJSON([
                {shortName: "S", type: DataFlow.OUTPUT_TYPES.NUMBER}
            ], opts, "output");

            /* S = start of series, N = step size, C = # of values in series */
            var inputs = this.createIObjectsFromJSON([
                {shortName: "S", required:false, default: 0, type: DataFlow.OUTPUT_TYPES.NUMBER},
                {shortName: "N", required:false, default: 1, type: DataFlow.OUTPUT_TYPES.NUMBER},
                {shortName: "C", required:false, default: 10, type: DataFlow.OUTPUT_TYPES.NUMBER}
            ], opts, "inputs");

            var args = _.extend(opts || {},{
                inputs: inputs,
                output: output,
                componentPrettyName: "Series",
                preview: false
            });
            this.base_init(args);
            this.recalculate(); // since it doesn't need any inputs to have valid output
        },
        recalculate: function(){
            var resultObject = DataMatcher([this["S"],this["N"],this["C"]],function(s,n,c){
                var seriesArr = [], count = 0;
                while (count < c) {
                    seriesArr.push(s+n*count);
                    count++;
                }
                return seriesArr;
            });

            // TODO: Figure out how Series components deal with lists. This is a hack.
            var final = new DataTree();
            resultObject.tree.recurseTree(function(data,node){
                final.setDataAtPath(data[0],node.getPath());
            });

            this.getOutput("S").replaceData(final);
        }
    });

    components.SliderComponent = DataFlow.Component.extend({
        initialize: function(opts){
            //var output = new DataFlow.OutputNumber({shortName: "N", default: 0.5});
            var output = this.createIObjectsFromJSON([
                {shortName: "N", type: DataFlow.OUTPUT_TYPES.NUMBER}
            ], opts, "output");

            /* S = start of series, N = step size, C = # of values in series */
            var inputs = this.createIObjectsFromJSON([
                {shortName: "S", required:false, default: 0, type: DataFlow.OUTPUT_TYPES.NUMBER},
                {shortName: "E", required:false, default: 1, type: DataFlow.OUTPUT_TYPES.NUMBER},
                {shortName: "I", required:false, default: false, type: DataFlow.OUTPUT_TYPES.BOOLEAN},
                {shortName: "N", required:false, default: 0.5, type: DataFlow.OUTPUT_TYPES.NUMBER, invisible: true}
            ], opts, "inputs");

            var args = _.extend({
                componentPrettyName: "Slider",
                preview: false
            },opts || {},{
                inputs: inputs,
                output: output
            });
            this.base_init(args);
        },
        storeUserData: function(val){
            var tree = new DataTree();
            tree.setDataAtPath([val],[0]);
            this.getInput("N").assignPersistedData(tree);
        },
        recalculate: function(){
            // Value is chosen directly in the UI, not calculated from inputs. Value is assigned directly to
            // "persistedData" on INPUT "N", then "recalculate" ensures that this value is actually inside the acceptable range
            // before assigning to the OUTPUT "N".
            var currVal = this.getInput("N").getFirstValueOrDefault();
            var min = this.getInput("S").getFirstValueOrDefault(),
                max = this.getInput("E").getFirstValueOrDefault(),
                integers = this.getInput("I").getFirstValueOrDefault();
            if (integers === true && Math.floor(currVal) != currVal) {
                currVal = Math.floor(currVal);
            }

            if (currVal > max) currVal = max;
            if (currVal < min) currVal = min;

            this.getOutput("N").values.setDataAtPath([currVal],[0]);// assignValues([currVal],[0]);
        }
    });

    return components;
});

