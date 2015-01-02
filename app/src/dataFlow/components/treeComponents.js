define([
    "underscore",
    "dataFlow/core"
],function(_,DataFlow){

    var components = {};

    components.GraftComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = new DataFlow.OutputMultiType();

            var input = new DataFlow.OutputMultiType({required: true, shortName: "T"});

            var args = _.extend(opts || {},{
                inputs: [
                    input
                ],
                output: output,
                componentPrettyName: "Graft"
            });
            this.base_init(args);
        },
        recalculate: function(){
            // Note that this component is a "wildcard" type output. One approach could maintain more data fidelity by forcing types to remain the same
            // per-component, but that requires a more complicated typing strategy on the way in and out of components that deal with the data trees directly.
            // This can always be added later, but it's not critical first-order functionality

            // grab the input, construct a new (grafted) tree.
            this.output.replaceData(this['T'].values.graftedTree());

            // updating the tree calls this automatically. It's part of the null checks.
            //this._recalculate();
        }
    });

    components.ShiftComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = new DataFlow.OutputMultiType({shortName: "L"});

            var inputData = new DataFlow.OutputMultiType({required: true, shortName: "L"}); // Data to shift
            var shiftDir = new DataFlow.OutputNumber({required: false, shortName: "S", default: 1}); // Shift Direction
            var wrap = new DataFlow.OutputBoolean({required: false, shortName: "W", default: true}); // wrap data?

            var args = _.extend(opts || {},{
                inputs: [
                    inputData,
                    shiftDir,
                    wrap
                ],
                output: output,
                componentPrettyName: "Shift"
            });
            this.base_init(args);
        },
        recalculate: function(){
            // Construct a new tree with shifted data
            this.output.clearValues();

            var that = this,
                out = that.output.values,
                nullOutputs = true,
                inputData = this["L"].getTree(),
                shiftDir = this["S"].getTree(),
                wrap = this["W"].getTree();

            inputData.recurseTree(function(dataList,node){
                var newList = dataList.slice(0),
                    p = node.getPath();

                var count = shiftDir.isEmpty() || _.isEmpty(shiftDir.dataAtPath(p,true)[0]) ? that["S"].getDefaultValue() : shiftDir.dataAtPath(p,true)[0];
                var wrapThis = wrap.isEmpty() || _.isEmpty(wrap.dataAtPath(p,true)[0]) ? that["W"].getDefaultValue() : wrap.dataAtPath(p,true)[0];
                var append = newList.splice(0,count); // cut off some chunk of array
                if (wrapThis === true) {
                    newList.push.apply(newList,append);
                }
                if (newList.length > 0) nullOutputs = false; // set null to false!
                out.setDataAtPath(p,newList);
            });

            this.output.setNull(nullOutputs);
            this._recalculate();
        }
    });

    return components;
});

