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
                {shortName: "C", type: DataFlow.OUTPUT_TYPES.CURVE, desc: "Circle"}
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "C", required: false, default: new THREE.Vector3(0,0,0), type: DataFlow.OUTPUT_TYPES.POINT, desc: "Center point"},
                {shortName: "N", required: false, default: new THREE.Vector3(0,0,1), type: DataFlow.OUTPUT_TYPES.POINT, desc: "Normal Vector"},
                {shortName: "R", required: true, type: DataFlow.OUTPUT_TYPES.NUMBER, desc: "Radius"}
            ], opts, "inputs");

            var args = _.extend({
                componentPrettyName: "Circle",
                preview: true
            },opts || {},{
                inputs: inputs,
                outputs: output
            });
            this.base_init(args);
        },
        recalculate: function(c,n,r){
            if (r === 0) return null;
            return {C: new Geometry.CircleCNR(c,n,r)};
        }
    },{
        "label": "Circle(Center,Normal, Radius)",
        "desc": "Outputs a circle curve based on a center point, normal vector, and radius"
    });

    return components;
});
