define([
    "underscore",
    "dataFlow/core",
    "SISL/sisl_loader",
    "dataFlow/UI/geometryPreviews",
    "dataFlow/dataMatcher"
],function(_,DataFlow,Geometry,Preview,DataMatcher){
    var components = {};

    components.GeometryRotateAxisAndCenterComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "G", type: DataFlow.OUTPUT_TYPES.WILD},     // rotated geometry
                {shortName: "X", type: DataFlow.OUTPUT_TYPES.MATRIX4}   // the transform matrix
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "G", required: true, type: DataFlow.OUTPUT_TYPES.WILD},                                         // Base geometry
                {shortName: "A", required: false, default: Math.PI/2, type: DataFlow.OUTPUT_TYPES.NUMBER},                  // Angle, radians
                {shortName: "C", required: false, default: new Geometry.Point(0,0,0), type: DataFlow.OUTPUT_TYPES.POINT},   // Center of Rotation
                {shortName: "X", required: false, default: new Geometry.Point(0,0,1), type: DataFlow.OUTPUT_TYPES.POINT}    // Axis of Rotation                
            ], opts, "inputs");

            var args = _.extend({
                componentPrettyName: "Rot3D",
                preview: true
            },opts || {},{
                inputs: inputs,
                outputs: output
            });
            this.base_init(args);
        },
        drawPreviews: function(){
            console.warn("TEMPORARY, MUST BE REMOVED. THIS PREVIEW FUNCTION ONLY DISPLAYS CURVE OUTPUT");
            var curves = this.getOutput("G").getTree().flattenedTree().dataAtPath([0]);

            var preview;
            if (_.isArray(this.previews) && this.previews.length > 0) {
                preview = this.previews[0];

                // update the preview geometry
                preview.updateCurveList(curves);
                preview.show();
            }
            else {
                preview = new Preview.CurveListPreview(curves);
                this.previews = [preview];
            }
        },
        recalculate: function(){
            var result = DataMatcher(
                [this.getInput("G"),this.getInput("A"),this.getInput("C"),this.getInput("X")],
                function(geom,angle,center,axis){
                    var matrix = geom.rotateAxisAndCenterMatrix(angle,axis,center);
                    return {
                        G: geom.applyMatrix4(matrix),
                        X: matrix
                    }
                });

            this.getOutput("G").replaceData(result.tree.map(function(data){return data.G}));
            this.getOutput("X").replaceData(result.tree.map(function(data){return data.X}));
        }
    });


    return components;
});

