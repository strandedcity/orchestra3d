define([
        "underscore",
        "dataFlow/core",
        "threejs",
        "dataFlow/UI/geometryPreviews",
        "dataFlow/dataTree",
        "dataFlow/dataMatcher"
    ],function(_,DataFlow,THREE,Preview,DataTree,DataMatcher){
        var components = {};

        components.PointComponent = DataFlow.Component.extend({
            initialize: function(opts){
                var output = this.createIObjectsFromJSON([
                    {shortName: "P", type: DataFlow.OUTPUT_TYPES.POINT}
                ], opts, "output");

                var args = _.extend(opts || {},{
                    inputs: this.getStandardPointInputs(opts),
                    output: output,
                    componentPrettyName: "Point(x,y,z)",
                    preview: false
                });
                this.base_init(args);
            },
            getStandardPointInputs: function(opts){
                return this.createIObjectsFromJSON([
                    {shortName: "X", type: DataFlow.OUTPUT_TYPES.NUMBER},
                    {shortName: "Y", type: DataFlow.OUTPUT_TYPES.NUMBER},
                    {shortName: "Z", type: DataFlow.OUTPUT_TYPES.NUMBER}
                ], opts, "inputs")
            },
            recalculate: function(){
                this.clearPreviews();

                var resultObject = DataMatcher([this["X"],this["Y"],this["Z"]],function(x,y,z){
                    return new THREE.Vector3(x,y,z);
                });

                this.getOutput("P").replaceData(resultObject.tree);
                this._recalculate();
            },
            drawPreviews: function(){
                var output = this.getOutput("P").getTree();
                var points = output.flattenedTree().dataAtPath([0]);
                this.previews.push(new Preview.PointListPreview(points));
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
        });

        /*  VectorComponent and PointComponent are mostly the same, but there's a separate component name and prototype if differences emerge */
        components.VectorComponent = components.PointComponent.extend({
            initialize: function(opts){
                var output = this.createIObjectsFromJSON([
                    {shortName: "V", type: DataFlow.OUTPUT_TYPES.POINT}
                ], opts, "output");

                var args = _.extend(opts || {},{
                    inputs: this.getStandardPointInputs(opts),
                    output: output, // Different name, same thing
                    preview: false, // in case the base class changes this behavior
                    componentPrettyName: "Vec(x,y,z)"
                });

                this.base_init(args);
            }
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
                    output: output,
                    componentPrettyName: "Vec2Pt",
                    preview: false
                });
                this.base_init(args);
            },
            recalculate: function(){
                this.getOutput("V").clearValues();

                var result = DataMatcher([this["A"],this["B"],this["U"]],function(a,b,u){
                    var endPt = b.clone().sub(a);
                    if (u === true) {endPt.normalize();}
                    return endPt;
                });

                this.getOutput("V").replaceData(result.tree);
                this._recalculate();
            }
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
                    output: output,
                    componentPrettyName: "VecNormal",
                    preview: false
                },opts || {});
                this.base_init(args);
            },
            recalculate: function(){
                this.getOutput("V").clearValues();

                var result = DataMatcher([this["V"]],function(v){
                    return v.clone().normalize();
                });

                this.getOutput("V").replaceData(result.tree);
                this._recalculate();
            }
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
                    inputs: inputs,
                    output: output,
                    componentPrettyName: "Distance",
                    preview: false
                },opts || {});
                this.base_init(args);
            },
            recalculate: function(){
                this.getOutput("D").clearValues();

                var result = DataMatcher([this["A"],this["B"]],function(a,b){
                    return a.distanceTo(b);
                });

                this.getOutput("D").replaceData(result.tree);
                this._recalculate();
            }
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
                    output: output,
                    componentPrettyName: "VDisplay",
                    preview: true
                });
                this.base_init(args);
            },
            recalculate: function(){
                this._recalculate();
            },
            drawPreviews: function(){
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
            }
        });

        return components;
});

