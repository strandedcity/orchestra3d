define([
        "underscore",
        "dataFlow/core",
        "threejs",
        "dataFlow/UI/geometryPreviews",
        "dataFlow/dataTree",
        "dataFlow/dataMatcher"
    ],function(_,DataFlow,THREE,Preview,DataTree,DataMatcher){
        var components = {};

        components.PointCollectionComponent = DataFlow.Component.extend({
            initialize: function(opts){
                this.base_init(
                    _.extend({componentPrettyName: "Pt"},opts || {},{
                        inputs: this.createIObjectsFromJSON([
                                    {required: true, shortName: "B", type: DataFlow.OUTPUT_TYPES.POINT, desc: "Point Values"}
                                ], opts, "inputs"),
                        outputs: output = this.createIObjectsFromJSON([
                                    {required: true, shortName: "B", type: DataFlow.OUTPUT_TYPES.POINT, containsNewData: false, desc: "Point Values"}
                                ], opts, "output")
                    })
                );
            },
            recalculate: function(b){
                // Not exactly a noop.... this uses the datamatcher to realign and merge data trees
                return {B:b};
            }
        },{
            "label": "Point",
            "desc": "Contains a collection of 3d points"
        });

        components.PointComponent = DataFlow.Component.extend({
            initialize: function(opts){
                var output = this.createIObjectsFromJSON([
                    {shortName: "P", type: DataFlow.OUTPUT_TYPES.POINT}
                ], opts, "output");

                var args = _.extend({
                    componentPrettyName: "Point(x,y,z)",
                    preview: true
                },opts || {},{
                    inputs: this.prepareTwoNumericInputs(opts),
                    outputs: output
                });
                this.base_init(args);
            },
            prepareTwoNumericInputs: function(opts){
                return this.createIObjectsFromJSON([
                    {shortName: "X", type: DataFlow.OUTPUT_TYPES.NUMBER},
                    {shortName: "Y", type: DataFlow.OUTPUT_TYPES.NUMBER},
                    {shortName: "Z", type: DataFlow.OUTPUT_TYPES.NUMBER}
                ], opts, "inputs")
            },
            recalculate: function(x,y,z){
                return {P : new THREE.Vector3(x,y,z)};
            },
            fetchPointCoordinates: function(){
                /* TODO: THIS FUNCTION IS STUPID. It's handy for writing tests, maybe, but it doesn't deal with the data trees in any useful way. */
                var outputs = this.getOutput().getTree().flattenedTree().dataAtPath([0]);
                var outputVals = [];  // returns array of GeoPoints
                _.each(outputs,function(GeoPoint){
                    outputVals.push(GeoPoint.toArray());
                });
                return outputVals;
            }
        },{
            "label": "Point(x,y,z)",
            "desc": "Creates a Point Object from X, Y, and Z coordinate values"
        });

        /*  VectorComponent and PointComponent are mostly the same, but there's a separate component name and prototype if differences emerge */
        components.VectorComponent = components.PointComponent.extend({
            initialize: function(opts){
                var output = this.createIObjectsFromJSON([
                    {shortName: "V", type: DataFlow.OUTPUT_TYPES.POINT}
                ], opts, "output");

                var args = _.extend(opts || {},{
                    inputs: this.prepareTwoNumericInputs(opts),
                    outputs: output,
                    preview: false, // in case the base class changes this behavior
                    componentPrettyName: "Vec(x,y,z)"
                });

                this.base_init(args);
            },
            recalculate: function(x,y,z){
                return {V : new THREE.Vector3(x,y,z)};
            },
        },{
            "label": "Vector(x,y,z)",
            "desc": "Generates a new vector based on x, y, and z values"
        });

        /*  Another way to define a vector: the vector connecting two points*/
        components.Vector2PtComponent = components.PointComponent.extend({
            initialize: function(opts){
                var output = this.createIObjectsFromJSON([
                    {shortName: "V", type: DataFlow.OUTPUT_TYPES.POINT}
                ], opts, "output");

                var inputs = this.createIObjectsFromJSON([
                    {required: true, shortName: "A", type: DataFlow.OUTPUT_TYPES.POINT},
                    {required: true, shortName: "B", type: DataFlow.OUTPUT_TYPES.POINT},
                    {required: false, shortName: "U", default: false, type: DataFlow.OUTPUT_TYPES.BOOLEAN}
                ], opts, "inputs");

                var args = _.extend(opts || {},{
                    inputs: inputs,
                    outputs: output,
                    componentPrettyName: "Vec2Pt",
                    preview: false
                });
                this.base_init(args);
            },
            recalculate: function(a,b,u){
                var endPt = b.clone().sub(a);
                var finalVal = u ? endPt.normalize() : endPt;
                return {V: finalVal};
            }
        },{
            "label": "Vector(p1,p2)",
            "desc": "Generates a new vector based on input points"
        });

        /*  Vector Normalize  */
        components.VectorNormalizeComponent = components.PointComponent.extend({
            initialize: function(opts){
                var output = this.createIObjectsFromJSON([
                    {shortName: "V", type: DataFlow.OUTPUT_TYPES.POINT}
                ], opts, "output");

                var inputs = this.createIObjectsFromJSON([
                    {required: true, shortName: "V", type: DataFlow.OUTPUT_TYPES.POINT}
                ], opts, "inputs");

                var args = _.extend({
                    inputs: inputs,
                    outputs: output,
                    componentPrettyName: "VecNormal",
                    preview: false
                },opts || {});
                this.base_init(args);
            },
            recalculate: function(v){
                return {V: v.clone().normalize()};
            }
        },{
            "label": "Vector Normalize",
            "desc": "Returns a unit vector with the same direction as the supplied vector"
        });

        /* Distance between two points */
        components.PointDistanceComponent = components.PointComponent.extend({
            initialize: function(opts){
                var output = this.createIObjectsFromJSON([
                    {shortName: "D", type: DataFlow.OUTPUT_TYPES.NUMBER}
                ], opts, "output");

                var inputs = this.createIObjectsFromJSON([
                    {required: true, shortName: "A", type: DataFlow.OUTPUT_TYPES.POINT},
                    {required: true, shortName: "B", type: DataFlow.OUTPUT_TYPES.POINT}
                ], opts, "inputs");

                var args = _.extend({
                    componentPrettyName: "Distance",
                    preview: false
                },opts || {},{
                    inputs: inputs,
                    outputs: output
                });
                this.base_init(args);
            },
            recalculate: function(a,b){
                return {D: a.distanceTo(b)};
            }
        },{
            "label": "Distance(p1,p2)",
            "desc": "Measures the distance between two supplied points"
        });

        /* Distance between two points */
        components.PointDeconstructComponent = components.PointComponent.extend({
            initialize: function(opts){
                var output = this.createIObjectsFromJSON([
                    {required: true, shortName: "X", type: DataFlow.OUTPUT_TYPES.NUMBER, desc: "X component"},
                    {required: true, shortName: "Y", type: DataFlow.OUTPUT_TYPES.NUMBER, desc: "Y component"},
                    {required: true, shortName: "Z", type: DataFlow.OUTPUT_TYPES.NUMBER, desc: "Z component"}
                ], opts, "outputs");

                var inputs = this.createIObjectsFromJSON([
                    {shortName: "P", type: DataFlow.OUTPUT_TYPES.POINT, desc: "Input point"}
                ], opts, "inputs");

                var args = _.extend({
                    componentPrettyName: "pDecon",
                    preview: false
                },opts || {},{
                    inputs: inputs,
                    outputs: output
                });
                this.base_init(args);
            },
            recalculate: function(p){
                return {
                    X: p.x,
                    Y: p.y,
                    Z: p.z,
                };
            }
        },{
            "label": "Deconstruct Point",
            "desc": "Deconstruct a point into its component parts"
        });

        /*  A special component displays the vectors. This is because the 'anchor' property
            belongs to the preview alone, and is not part of the vector's mathematical properties.
         */
        components.VectorDisplayComponent = components.PointComponent.extend({
            initialize: function(opts){
                var output = this.createIObjectsFromJSON([
                    {shortName: "x", type: DataFlow.OUTPUT_TYPES.NULL}
                ], opts, "output");

                var inputs = this.createIObjectsFromJSON([
                    {required: false, shortName: "A", type: DataFlow.OUTPUT_TYPES.POINT},
                    {required: true, shortName: "V", type: DataFlow.OUTPUT_TYPES.POINT}
                ], opts, "inputs");

                var args = _.extend(opts || {},{
                    inputs: inputs,
                    outputs: output,
                    componentPrettyName: "VDisplay",
                    preview: true
                });
                this.base_init(args);
            },
            recalculateTrees: function(){/* // no-op since this component's purpose is display only */},
            drawPreviews: function(){
                console.log('drawing previews');
                this.clearPreviews(); // needed here since this component does not have a recalculate phase that deletes prior previews
                var that=this,
                    vectors = this["V"].getTree(),
                    anchors = this["A"].getTree() || new DataTree();
                vectors.recurseTree(function(data,node){
                    var correspondingAnchorData = anchors.dataAtPath(node.getPath(),false);
                    _.each(data, function(item,index){
                        var a = correspondingAnchorData[index] || new THREE.Vector3(0,0,0);
                        that.previews.push(new Preview.VectorPreview(a,item));
                    });
                });
                vectors.log();
            }
        },{
            "label": "Vector Display",
            "desc": "Enables vectors to be displayed in the model view using an optional 'anchor point'"
        });

        return components;
});

