define([
    "underscore",
    "dataFlow/core",
    "SISL/sisl_loader",
    "dataFlow/UI/geometryPreviews",
    "dataFlow/dataMatcher"
],function(_,DataFlow,Geometry,Preview,DataMatcher){
    var components = {};

    components.CircleCNRComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "C", type: DataFlow.OUTPUT_TYPES.CURVE}
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "C", required: false, default: new THREE.Vector3(0,0,0), type: DataFlow.OUTPUT_TYPES.POINT},
                {shortName: "N", required: false, default: new THREE.Vector3(0,0,1), type: DataFlow.OUTPUT_TYPES.POINT},
                {shortName: "R", required: true, type: DataFlow.OUTPUT_TYPES.NUMBER}
            ], opts, "inputs");

            var args = _.extend(opts || {},{
                inputs: inputs,
                output: output,
                componentPrettyName: "Circle",
                preview: true
            });
            this.base_init(args);
        },
        recalculate: function(){
            this.getOutput("C").clearValues();

            // TODO: Protect against errors with zero-radius circles
            var result = DataMatcher([this["C"],this["N"],this["R"]],function(c,n,r){
                if (r === 0) return null;
                return new Geometry.CircleCNR(c,n,r);
            });

            this.getOutput("C").replaceData(result.tree);
            this._recalculate();
        },
        drawPreviews: function(){
            this.clearPreviews(); // needed here since this component does not have a recalculate phase that deletes prior previews
            var that=this;
            this.getOutput("C").getTree().recurseTree(function(data){
                _.each(data, function(curve){
                    that.previews.push(new Preview.CurvePreview(curve));
                });
            });
        }
    });

    return components;
});
