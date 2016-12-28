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
        recalculate: function(){
            var result = DataMatcher(
                [this.getInput("G"),this.getInput("A"),this.getInput("C"),this.getInput("X")],
                function(geom,angle,center,axis){
                    // console.log('rotating '+geom + " by " + angle + " radians " + " along ", axis.toArray() + " around " + center.toArray());
                    var matrix = geom.rotateAxisAndCenterMatrix(angle,axis,center);
                    return {
                        G: geom.applyMatrix4(matrix),
                        X: matrix
                    }
                });

            this.getOutput("G").replaceData(result.tree.map(function(data){return data.G}));
            this.getOutput("X").replaceData(result.tree.map(function(data){return data.X}));
        }
    },{
        "label": "Rotate 3D",
        "desc": "Rotate around a 3D Axis and Center Point"
    });


    components.GeometryMoveComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "G", type: DataFlow.OUTPUT_TYPES.WILD},     // rotated geometry
                {shortName: "X", type: DataFlow.OUTPUT_TYPES.MATRIX4}   // the transform matrix
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "G", required: true, type: DataFlow.OUTPUT_TYPES.WILD},                                         // Base geometry
                {shortName: "T", required: false, default: new Geometry.Point(0,0,0), type: DataFlow.OUTPUT_TYPES.POINT},   // Translation Vector              
            ], opts, "inputs");

            var args = _.extend({
                componentPrettyName: "Move",
                preview: true
            },opts || {},{
                inputs: inputs,
                outputs: output
            });
            this.base_init(args);
        },
        recalculate: function(){
            var result = DataMatcher(
                [this.getInput("G"),this.getInput("T")],
                function(geom,translation){
                    var matrix = geom.translateMatrix(translation);
                    return {
                        G: geom.applyMatrix4(matrix),
                        X: matrix
                    }
                });

            this.getOutput("G").replaceData(result.tree.map(function(data){return data.G}));
            this.getOutput("X").replaceData(result.tree.map(function(data){return data.X}));
        }
    },{
        "label": "Move",
        "desc": "Translate (move) and object along a vector"
    });

    return components;
});

