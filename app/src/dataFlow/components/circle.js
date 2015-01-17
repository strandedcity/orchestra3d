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
            window.LOG_TIME_EVENT("BEGIN RECALCULATE");
            this.getOutput("C").clearValues();

            // TODO: Protect against errors with zero-radius circles
            var result = DataMatcher([this["C"],this["N"],this["R"]],function(c,n,r){
                if (r === 0) return null;
                return new Geometry.CircleCNR(c,n,r);
            });

            this.getOutput("C").replaceData(result.tree);

            window.LOG_TIME_EVENT("END RECALCULATE");
            this._recalculate();
        },
        clearPreviews: function(){
            window.LOG_TIME_EVENT("BEGIN CLEAR PREVIEWS");
            DataFlow.Component.prototype.clearPreviews.call(this);
            window.LOG_TIME_EVENT("END CLEAR PREVIEWS");
        },
        drawPreviews: function(){

            //this.clearPreviews(); // needed here since this component does not have a recalculate phase that deletes prior previews

            window.LOG_TIME_EVENT("BEGIN REDRAW");
            var that=this;
            var curves = [];
            this.getOutput("C").getTree().recurseTree(function(data){
                _.each(data, function(curve){
                    curves.push(curve);
                });
            });

            that.previews.push(new Preview.CurveListPreview(curves));

            window.LOG_TIME_EVENT("DONE DRAWING PREVIEWS",true);
        }
    });

    return components;
});
