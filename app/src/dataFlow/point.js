define([
        "underscore",
        "dataFlow/core",
        "SISL/sisl_loader",
        "dataFlow/UI/geometryPreviews",
        "dataFlow/dataTree",
        "dataFlow/dataMatcher"
    ],function(_,DataFlow,Geometry,Preview,DataTree,DataMatcher){
        var PointComponent = DataFlow.PointComponent = function PointComponent(opts){
            this.initialize.apply(this, arguments);
        };

        _.extend(PointComponent.prototype, DataFlow.Component.prototype,{
            initialize: function(opts){
                var output = new DataFlow.OutputPoint();

                var inputs = [
                    new DataFlow.OutputNumber({shortName: "X"}),
                    new DataFlow.OutputNumber({shortName: "Y"}),
                    new DataFlow.OutputNumber({shortName: "Z"})
                ];

                var args = _.extend(opts || {},{
                    inputs: inputs,
                    output: output,
                    componentPrettyName: "Point(x,y,z)",
                    drawPreview: false
                });
                this.base_init(args);
            },
            recalculate: function(){
                this.clearPreviews();

                var resultObject = DataMatcher([this["X"],this["Y"],this["Z"]],function(x,y,z){
                    return new Geometry.Point(x,y,z);
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

        /*  VectorComponent and PointComponent are mostly the same, but are used in different ways and
            are technically different data types.
            TODO: Delete the duplicated code in the initializer
         */
        var VectorComponent = DataFlow.VectorComponent = function VectorComponent(opts){
            this.initialize.apply(this, arguments);
        };
        _.extend(VectorComponent.prototype, DataFlow.Component.prototype,{
            initialize: function(opts){
                var output = new DataFlow.OutputPoint({shortName: "V"});

                var inputs = [
                    new DataFlow.OutputNumber({shortName: "X"}),
                    new DataFlow.OutputNumber({shortName: "Y"}),
                    new DataFlow.OutputNumber({shortName: "Z"})
                ];

                var args = _.extend({
                    inputs: inputs,
                    output: output,
                    componentPrettyName: "Vec(x,y,z)",
                    drawPreview: false
                },opts || {});
                this.base_init(args);
            },
            // inherit recalculation completely
            recalculate: function(){
                PointComponent.prototype.recalculate.apply(this,arguments);
            }
        });

        VectorComponent.prototype.constructor = DataFlow.VectorComponent.constructor;

        /*  Another way to define a vector: the vector connecting two points*/
        var Vector2PtComponent = DataFlow.Vector2PtComponent = function Vector2PtComponent(opts){
            this.initialize.apply(this, arguments);
        };
        _.extend(Vector2PtComponent.prototype, DataFlow.Component.prototype,{
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
                    // TODO: This is really inefficient, and for no reason. GeoPoint should be removed entirely in favor of THREE.Vector3 to avoid reconstructing duplicate objects all over the place.
                    return new Geometry.Point(endPt.x,endPt.y,endPt.z);
                });

                this.output.replaceData(result.tree);
                this._recalculate();
            }
        });

        /*  A special component displays the vectors. This is because the 'anchor' property
            belongs to the preview alone, and is not part of the vector's mathematical properties.
         */
        var VectorDisplayComponent = DataFlow.VectorDisplayComponent = function VectorDisplayComponent(opts){
            this.initialize.apply(this,arguments);
        };

        _.extend(VectorDisplayComponent.prototype, DataFlow.Component.prototype,{
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

        return DataFlow;
});

