define([
    "underscore",
    "dataFlow/core"
],function(_,DataFlow){

    var Tree = {};

    Tree.GraftComponent = function GraftComponent(opts){
        this.initialize.apply(this, arguments);
    };

    _.extend(Tree.GraftComponent.prototype, DataFlow.Component.prototype,{
        initialize: function(opts){
            // this is really a placeholder. The entire output object will be replaced every time a connection
            // is made, so that the output has the correct data type associated with it.
            var output = new DataFlow.OutputMultiType();

            var input = new DataFlow.OutputMultiType({required: true, shortName: "T"});

            var args = _.extend(opts || {},{
                inputs: [
                    input
                ],
                output: output,
                resultFunction: this.recalculate,
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

    return {Tree: Tree};
});

