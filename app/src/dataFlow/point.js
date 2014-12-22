define([
        "underscore",
        "dataFlow/core",
        "SISL/sisl_loader",
        "dataFlow/UI/geometryPreviews",
        "dataFlow/dataTree"
    ],function(_,DataFlow,Geometry,Preview,DataTree){
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
                    resultFunction: this.recalculate,
                    componentPrettyName: "Point(x,y,z)",
                    drawPreview: false
                });
                this.base_init(args);
            },
            recalculate: function(){
                this.clearPreviews();
                this.output.clearValues();

                var that = this,
                    out = that.output.values,
                    nullOutputs = true;

                this["X"].values.recurseTree(function(xvals,node){
                    var pointList = [],
                        p = node.getPath();

                    _.each(xvals,function(val,idx){
                        var y = that["Y"].getTree().dataAtPath(p)[idx],
                            z = that["Z"].getTree().dataAtPath(p)[idx];
                        pointList[idx] = new Geometry.Point(val,y,z);
                    });

                    if (pointList.length > 0) nullOutputs = false; // set null to false!
                    out.setDataAtPath(p,pointList);
                });

                this.output.setNull(nullOutputs);
                this._recalculate();
            },
            drawPreviews: function(){
                var output = this.output.values;
                var points = output.flattenedTree().dataAtPath([0]);
                this.previews.push(new Preview.PointListPreview(points));
            },

            fetchPointCoordinates: function(){
                /* THIS FUNCTION IS STUPID. It's handy for writing tests, maybe, but it doesn't deal with the data trees in any useful way. */
                var outputs = this.output.getTree().flattenedTree().dataAtPath([0]);
                var outputVals = [];  // returns array of GeoPoints
                _.each(outputs,function(GeoPoint){
                    outputVals.push(GeoPoint.getCoordsArray());
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
                    resultFunction: this.recalculate,
                    componentPrettyName: "Vec(x,y,z)",
                    drawPreview: false
                },opts || {});
                this.base_init(args);
            },
            // inherit recalculation completely
            recalculate: PointComponent.prototype.recalculate
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
                    new DataFlow.OutputBoolean({required: false, shortName: "U"})
                ];

                var args = _.extend({
                    inputs: inputs,
                    output: output,
                    resultFunction: this.recalculate,
                    componentPrettyName: "Vec2Pt",
                    drawPreview: false
                },opts || {});
                this.base_init(args);
            },
            recalculate: function(){
                this.output.clearValues();

                var that = this,
                    out = that.output.values,
                    nullOutputs = true,
                    aVectors = this["A"].getTree(),
                    unitize = this["U"].getTree();

                this["B"].values.recurseTree(function(bvectors,node){
                    var outputList = [],
                        p = node.getPath();

                    _.each(bvectors,function(val,idx){
                        var endPoint = val.clone();
                        outputList[idx] = endPoint.sub(aVectors.dataAtPath(p)[idx]);
                        if (!_.isNull(unitize) && unitize.dataAtPath(p)[idx] === true) outputList[idx].normalize();
                    });

                    if (outputList.length > 0) nullOutputs = false; // set null to false!
                    out.setDataAtPath(p,outputList);
                });

                this.output.setNull(nullOutputs);
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
                    resultFunction: this.recalculate,
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

