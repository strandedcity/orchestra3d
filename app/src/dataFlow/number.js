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
            this.recalculate();
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

    return DataFlow;
});

