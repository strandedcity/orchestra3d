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
            this._recalculate();
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
                final.setDataAtPath(node.getPath(),data[0]);
            });

            this.getOutput("S").replaceData(final);
            this._recalculate();
        }
    });

    components.SliderComponent = DataFlow.Component.extend({
        initialize: function(opts){
            //var output = new DataFlow.OutputNumber({shortName: "N", default: 0.5});
            var output = this.createIObjectsFromJSON([
                {shortName: "N", default: 0.5, type: DataFlow.OUTPUT_TYPES.NUMBER}
            ], opts, "output");

            /* S = start of series, N = step size, C = # of values in series */
            var inputs = this.createIObjectsFromJSON([
                {shortName: "S", required:false, default: 0, type: DataFlow.OUTPUT_TYPES.NUMBER},
                {shortName: "E", required:false, default: 1, type: DataFlow.OUTPUT_TYPES.NUMBER},
                {shortName: "I", required:false, default: false, type: DataFlow.OUTPUT_TYPES.BOOLEAN}
            ], opts, "inputs");

            var args = _.extend(opts || {},{
                inputs: inputs,
                output: output,
                componentPrettyName: "Slider",
                preview: false
            });
            this.base_init(args);
        },
        recalculate: function(){
            // Value is chosen directly in the UI, not calculated from inputs.
            // However, when max/min and integer values change, the single output value must be checked to make sure that
            // it does, in fact, satisfy specified conditions.
            // Since the slider can select only a single value, only the first value in each list is considered.
            var currVal = this.getOutput("N").getTree().dataAtPath([0],false);
            var min = this.getInput("S").getFirstValueOrDefault(),
                max = this.getInput("E").getFirstValueOrDefault(),
                integers = thie.getInput("I").getFirstValueOrDefault();
            if (integers === true && Math.floor(currVal) != currVal) {
                currVal = Math.floor(currVal);
            }

            if (currVal > max) currVal = max;
            if (currVal < min) currVal = min;

            this.getOutput("N").getTree().setDataAtPath([0],[currVal]);

            this._recalculate();
        }
    });

    return components;
});

