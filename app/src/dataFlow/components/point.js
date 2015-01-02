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
                var output = new DataFlow.OutputPoint();

                var inputs = [
                    new DataFlow.OutputNumber({shortName: "X"}),
                    new DataFlow.OutputNumber({shortName: "Y"}),
                    new DataFlow.OutputNumber({shortName: "Z"})
                ];

                var args = _.extend({
                    inputs: inputs,
                    output: output,
                    componentPrettyName: "Point(x,y,z)",
                    drawPreview: false
                },opts || {});
                this.base_init(args);
            },
            recalculate: function(){
                this.clearPreviews();

                var resultObject = DataMatcher([this["X"],this["Y"],this["Z"]],function(x,y,z){
                    return new THREE.Vector3(x,y,z);
                });

                this.output.replaceData(resultObject.tree);
                this._recalculate();
            },
            drawPreviews: function(){
                var output = this.output.values;
                var points = output.flattenedTree().dataAtPath([0]);
                this.previews.push(new Preview.PointListPreview(points));
            },

            fetchPointCoordinates: function(){
                /* TODO: THIS FUNCTION IS STUPID. It's handy for writing tests, maybe, but it doesn't deal with the data trees in any useful way. */
                var outputs = this.output.getTree().flattenedTree().dataAtPath([0]);
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

                var output = new DataFlow.OutputPoint({shortName: "V"});

                var args = _.extend({
                    output: output, // Different name, same thing
                    drawPreview: false, // in case the base class changes this behavior
                    componentPrettyName: "Vec(x,y,z)"
                },opts || {});
                components.PointComponent.prototype.initialize.call(this,args);

                _.extend(this,components.PointComponent.prototype);
            }
        });

        /*  Another way to define a vector: the vector connecting two points*/
        components.Vector2PtComponent = components.PointComponent.extend({
            initialize: function(opts){
                var output = new DataFlow.OutputPoint({shortName: "V"});

                var inputs = [
                    new DataFlow.OutputPoint({required: true, shortName: "A"}),
                    new DataFlow.OutputPoint({required: true,shortName: "B"}),
                    new DataFlow.OutputBoolean({required: false, shortName: "U", default: false})
                ];

                var args = _.extend({
                    inputs: inputs,
                    output: output,
                    componentPrettyName: "Vec2Pt",
                    drawPreview: false
                },opts || {});
                this.base_init(args);
            },
            recalculate: function(){
                this.output.clearValues();

                var result = DataMatcher([this["A"],this["B"],this["U"]],function(a,b,u){
                    var endPt = b.clone().sub(a);
                    if (u === true) {endPt.normalize();}
                    return endPt;
                });

                this.output.replaceData(result.tree);
                this._recalculate();
            }
        });

        /*  Vector Normalize  */
        components.VectorNormalizeComponent = components.PointComponent.extend({
            initialize: function(opts){
                var output = new DataFlow.OutputPoint({shortName: "V"});

                var inputs = [
                    new DataFlow.OutputPoint({required: true, shortName: "V"})
                ];

                var args = _.extend({
                    inputs: inputs,
                    output: output,
                    componentPrettyName: "VecNormal",
                    drawPreview: false
                },opts || {});
                this.base_init(args);
            },
            recalculate: function(){
                this.output.clearValues();

                var result = DataMatcher([this["V"]],function(v){
                    return v.clone().normalize();
                });

                this.output.replaceData(result.tree);
                this._recalculate();
            }
        });

        /* Distance between two points */
        components.PointDistanceComponent = components.PointComponent.extend({
            initialize: function(opts){
                var output = new DataFlow.OutputNumber({shortName: "D"});

                var inputs = [
                    new DataFlow.OutputPoint({required: true, shortName: "A"}),
                    new DataFlow.OutputPoint({required: true, shortName: "B"})
                ];

                var args = _.extend({
                    inputs: inputs,
                    output: output,
                    componentPrettyName: "Distance",
                    drawPreview: false
                },opts || {});
                this.base_init(args);
            },
            recalculate: function(){
                this.output.clearValues();

                var result = DataMatcher([this["A"],this["B"]],function(a,b){
                    return a.distanceTo(b);
                });

                this.output.replaceData(result.tree);
                this._recalculate();
            }
        });

        /*  A special component displays the vectors. This is because the 'anchor' property
            belongs to the preview alone, and is not part of the vector's mathematical properties.
         */
        components.VectorDisplayComponent = components.PointComponent.extend({
            initialize: function(opts){
                var output = new DataFlow.OutputNull();

                var inputs = [
                    new DataFlow.OutputPoint({shortName: "A", required: false}), // "anchor" for the vector display
                    new DataFlow.OutputPoint({shortName: "V"})  // Vector to draw
                ];

                var args = _.extend({
                    inputs: inputs,
                    output: output,
                    componentPrettyName: "VDisplay",
                    drawPreview: true
                },opts || {});
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

