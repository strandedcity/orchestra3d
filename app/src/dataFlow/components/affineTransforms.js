define([
    "underscore",
    "dataFlow/core",
    "SISL/sisl_loader",
    "dataFlow/UI/geometryPreviews",
    "dataFlow/dataMatcher"
],function(_,DataFlow,Geometry,Preview,DataMatcher){
    var components = {};

    // components.PlaneNormalComponent // Define based on center and Z-axis vector
    // components.AlignPlaneComponent // Perform minimal rotation to align a plane with a guide vector

    components.OrientComponent = DataFlow.Component.extend({
        initialize: function(opts){
            this.base_init(
                _.extend({
                    componentPrettyName: "Orient",
                    preview: true
                },opts || {},{
                    inputs:     this.createIObjectsFromJSON([
                                    {shortName: "G", required: true, type: DataFlow.OUTPUT_TYPES.WILD, desc: "Base geometry"},
                                    {shortName: "A", required: true, type: DataFlow.OUTPUT_TYPES.PLANE, desc: "Initial plane"}, 
                                    {shortName: "B", required: true, type: DataFlow.OUTPUT_TYPES.PLANE, desc: "Final plane"}       
                                ], opts, "inputs"),
                    outputs:    this.createIObjectsFromJSON([
                                    {shortName: "G", type: DataFlow.OUTPUT_TYPES.WILD, desc: "Reoriented geometry"},
                                    {shortName: "X", type: DataFlow.OUTPUT_TYPES.MATRIX4, desc: "Transformation data"}
                                ], opts, "output")
                })
            );
        },
        recalculate: function(g,a,b){
            var matrix = a.getChangeBasisMatrixForTransformationTo(b),
                // if .applyMatrix4 is inherited from THREEJS, it will translate the object in place (which we don't want)
                geomCopy = typeof g.clone === "function" ? g.clone() : g; 
            
            var outputGeometry = geomCopy.applyMatrix4(matrix);
            
            return {
                G: outputGeometry,
                X: matrix
            };
        }
    },{
        "label": "Orient",
        "desc": "Orient an object. Orientation is sometimes called a 'ChangeBasis' transformation"
    });

    components.Plane3PointComponent = DataFlow.Component.extend({
        initialize: function(opts){
            this.base_init(
                _.extend({
                    componentPrettyName: "Pl 3Pt",
                    preview: false
                },opts || {},{
                    inputs:     this.createIObjectsFromJSON([
                                    {shortName: "A", required: true, type: DataFlow.OUTPUT_TYPES.POINT, desc: "Origin point"},
                                    {shortName: "B", required: true, type: DataFlow.OUTPUT_TYPES.POINT, desc: "X-direction point"}, 
                                    {shortName: "C", required: true, type: DataFlow.OUTPUT_TYPES.POINT, desc: "Orientation point"}       
                                ], opts, "inputs"),
                    outputs:    this.createIObjectsFromJSON([
                                    {shortName: "Pl", type: DataFlow.OUTPUT_TYPES.PLANE, desc: "Plane definition"}
                                ], opts, "output")
                })    
            );
        },
        recalculate: function(a,b,c){
            var p = new Geometry.Plane();
            p.setFromCoplanarPoints(a,b,c);
            return {Pl: p};
        }
    },{
        "label": "Plane 3-Point",
        "desc": "Create a plane through three points"
    });


    components.GeometryRotateAxisAndCenterComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "G", type: DataFlow.OUTPUT_TYPES.WILD, desc: "Rotated geometry"},     // rotated geometry
                {shortName: "X", type: DataFlow.OUTPUT_TYPES.MATRIX4, desc: "Transformation matrix"}   // the transform matrix
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "G", required: true, type: DataFlow.OUTPUT_TYPES.WILD, desc: "Base geometry"},                                         // Base geometry
                {shortName: "A", required: false, default: Math.PI/2, type: DataFlow.OUTPUT_TYPES.NUMBER, desc: "Angle in radians"},                  // Angle, radians
                {shortName: "C", required: false, default: new Geometry.Point(0,0,0), type: DataFlow.OUTPUT_TYPES.POINT, desc: "Center of rotation"},   // Center of Rotation
                {shortName: "X", required: false, default: new Geometry.Point(0,0,1), type: DataFlow.OUTPUT_TYPES.POINT, desc: "Axis of rotation"}    // Axis of Rotation                
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
        recalculate: function(geom,angle,center,axis){
            // console.log('rotating '+geom + " by " + angle + " radians " + " along ", axis.toArray() + " around " + center.toArray());
            var matrix = geom.rotateAxisAndCenterMatrix(angle,axis,center),
                // if .applyMatrix4 is inherited from THREEJS, it will translate the object in place (which we don't want)
                geomCopy = typeof geom.clone === "function" ? geom.clone() : geom; 
            return {
                G: geomCopy.applyMatrix4(matrix),
                X: matrix
            }
        }
    },{
        "label": "Rotate 3D",
        "desc": "Rotate around a 3D Axis and Center Point"
    });


    components.GeometryMoveComponent = DataFlow.Component.extend({
        initialize: function(opts){
            var output = this.createIObjectsFromJSON([
                {shortName: "G", type: DataFlow.OUTPUT_TYPES.WILD, desc: "Moved geometry"},     // rotated geometry
                {shortName: "X", type: DataFlow.OUTPUT_TYPES.MATRIX4, desc: "Transformation matrix"}   // the transform matrix
            ], opts, "output");

            var inputs = this.createIObjectsFromJSON([
                {shortName: "G", required: true, type: DataFlow.OUTPUT_TYPES.WILD, desc: "Base geometry"},                                         // Base geometry
                {shortName: "T", required: false, default: new Geometry.Point(0,0,0), type: DataFlow.OUTPUT_TYPES.POINT, desc: "Translation vector"},   // Translation Vector              
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
        recalculate: function(geom,translation){
            var matrix = Geometry.Utils.translateMatrix(translation),
                // if .applyMatrix4 is inherited from THREEJS, it will translate the object in place (which we don't want)
                geomCopy = typeof geom.clone === "function" ? geom.clone() : geom; 
            return {
                G: geomCopy.applyMatrix4(matrix),
                X: matrix
            }
        }
    },{
        "label": "Move",
        "desc": "Translate (move) and object along a vector"
    });

    return components;
});

