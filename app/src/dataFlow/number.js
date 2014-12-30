define([
    "underscore",
    "dataFlow/core",
    "dataFlow/dataTree",
    "dataFlow/dataMatcher"
],function(_,DataFlow,DataTree,DataMatcher){
    var NumberComponent = DataFlow.NumberComponent = function NumberComponent(opts){
        this.initialize.apply(this, arguments);
    };

    _.extend(NumberComponent.prototype, DataFlow.Component.prototype,{
        initialize: function(opts){
            var output = new DataFlow.OutputNumber();

            var args = _.extend(opts || {},{
                inputs: [
                    new DataFlow.OutputNumber({required: false, shortName: "#"})
                ],
                output: output,
                componentPrettyName: "Number"
            });
            this.base_init(args);
        },
        recalculate: function(){
            this.output.clearValues();
            this.output.values = this.inputs['#'].values.copy();
            this._recalculate();
        },
        parseInputAndSet: function(input){
            var arr = [];
            try {
                var arrStr = "[" + input.replace(/[\s,]+$/, "") + "]";
                    arr = JSON.parse(arrStr);
            } catch (e){
                console.warn("Failed to parse user-entered numbers: " + input);
            }

            // empty out number if failure to parse
            this.output.assignValues(arr);
        }
    });

    var SeriesComponent = DataFlow.SeriesComponent = function SeriesComponent(opts){
        this.initialize.apply(this,arguments);
    };

    _.extend(SeriesComponent.prototype, DataFlow.Component.prototype,{
        initialize: function(opts){
            var output = new DataFlow.OutputNumber({shortName: "S"});

            /* S = start of series, N = step size, C = # of values in series */
            var inputs = [
                new DataFlow.OutputNumber({shortName: "S", required:false, default: 0}),
                new DataFlow.OutputNumber({shortName: "N", required:false, default: 1}),
                new DataFlow.OutputNumber({shortName: "C", required:false, default: 10})
            ];

            var args = _.extend({
                inputs: inputs,
                output: output,
                componentPrettyName: "Series",
                drawPreview: false
            },opts || {});
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

            this.output.replaceData(final);
            this._recalculate();
        },
    });

    var SliderComponent = DataFlow.SliderComponent = function SliderComponent(opts){
        this.initialize.call(this,opts);
    };

    _.extend(SliderComponent.prototype, DataFlow.Component.prototype,{
        initialize: function(opts){
            var output = new DataFlow.OutputNumber({shortName: "N"});

            /* S = start of series, N = step size, C = # of values in series */
            var inputs = [
                new DataFlow.OutputNumber({shortName: "S", required:false, default: 0}),  // Start Value (min)
                new DataFlow.OutputNumber({shortName: "E", required:false, default: 1}),  // End Value (max)
                new DataFlow.OutputBoolean({shortName: "I", required:false, default: false}) // Integers only?
            ];

            var args = _.extend({
                inputs: inputs,
                output: output,
                componentPrettyName: "Slider",
                drawPreview: false
            },opts || {});
            this.base_init(args);
        },
        recalculate: function(){
            // Value is chosen directly in the UI, not calculated from inputs.
            // However, when max/min and integer values change, the single output value must be checked to make sure that
            // it does, in fact, satisfy specified conditions.
            // Since the slider can select only a single value, only the first value in each list is considered.
            var currVal = this.output.getTree().dataAtPath([0],false);
            var min = this["S"].getFirstValueOrDefault(),
                max = this["E"].getFirstValueOrDefault(),
                integers = this["I"].getFirstValueOrDefault();
            if (integers === true && Math.floor(currVal) != currVal) {
                currVal = Math.floor(currVal);
            }

            if (currVal > max) currVal = max;
            if (currVal < min) currVal = min;

            this.output.getTree().setDataAtPath([0],[currVal]);

            this._recalculate();
        }
    });

    return DataFlow;
});

