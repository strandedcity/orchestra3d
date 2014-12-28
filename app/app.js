require(["appconfig"],function(){
    require([
            'SISL/sisl_loader',
            'dataFlow/dataFlow_loader',
            "viewer/modelView",
            "dataFlow/UI/workspaceView",
            "windowControls", // File, Model, Settings, Login, etc.... the top bar
            "dataFlow/UI/componentView"
        ],
        function(
            Geo,
            dataFlow,
            viewer,
            workspace,
            windowControls,
            ComponentView
        ){
            function App(){
                viewer.createScene(); // viewer class shouldn't initialize itself; it should be testable without being in the DOM
                workspace.createWorkspace();

                var axisHelper = new THREE.AxisHelper( 2 );
                viewer.scene.add( axisHelper );

//                var dir = new THREE.Vector3( 1, 0, 0 );
//                var origin = new THREE.Vector3( 0, 0, 0 );
//                var length =3;
//                var hex = 0xffff00;
//
//                var arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
//                viewer.scene.add( arrowHelper );
//
//                var destdir = (new THREE.Vector3(0.5,0.5,-0.5)).normalize(),
//                    destOrigin = new THREE.Vector3(1,1,1);
//                var arr2 = new THREE.ArrowHelper(destdir,destOrigin,length,hex);
//                viewer.scene.add(arr2);
//
//
//                // get the quaternion rotation between these vectors:
//                // http://stackoverflow.com/questions/25199173/how-to-find-rotation-matrix-between-two-vectors-in-three-js
//                var quaternion = new THREE.Quaternion().setFromUnitVectors( dir, destdir );
//
//                var diff = destOrigin.sub(origin);
//                var composed = (new THREE.Matrix4()).compose(diff,quaternion,new THREE.Vector3(1,1,1));



/////////////////////////////////// PAIRS WITH THIS WHERE CURVE IS ACCESSIBLE
///////////////////////////////////
//                this["V"].values.recurseTree(function(pointList,node){
//                    var movedPoints = [];
//                    _.each(pointList,function(pt){
//                        var coords = pt.getCoordsArray();
//                        var oldPt = new THREE.Vector3(coords[0],coords[1],coords[2]);
//
//                        oldPt.applyMatrix4( composed );
//                        var newpt = new Geometry.Point(oldPt.x,oldPt.y,oldPt.z);
//                        movedPoints.push(newpt);
//                    });
//                    var c = new Geometry.Curve(movedPoints,degree,periodic);
//                    that.previews.push(new Preview.CurvePreview(c));
//                });

                this.init();
            }

            App.prototype.init = function(){
                // Activate only one at a time, maybe? In any case, global controls:
                //workspace.enableControls(false);
                //viewer.enableControls(true);

                // Demonstration programs...
                this.NURBSCurveTest();

                viewer.render();
            };

            App.prototype.NURBSCurveTest = function(){
                var point1 = new ComponentView(new dataFlow.PointComponent({
                    position: {x: 500, y: 0}
                }));
                var vec1 = new ComponentView(new dataFlow.VectorComponent({
                    position: {x: 500, y: 550}
                }));
                var vecDisplay = new ComponentView(new dataFlow.VectorDisplayComponent({
                    position: {x: 2200, y: 550}
                }));
                var shift1 = new ComponentView(new dataFlow.Tree.ShiftComponent({
                    position: {x: 1200, y: 750}
                }));
                var vec2pt = new ComponentView(new dataFlow.Vector2PtComponent({
                    position: {x: 1700, y: 750}
                }));

                var number1 = new ComponentView(new dataFlow.NumberComponent({
                    position: {x: -200, y: 100}
                }));
                var number2 = new ComponentView(new dataFlow.NumberComponent({
                    position: {x: -200, y: 0}
                }));
                var number3 = new ComponentView(new dataFlow.NumberComponent({
                    position: {x: -200, y: -100}
                }));

                var curve = new ComponentView(new dataFlow.CurveControlPointComponent({
                    position: {x: 1400, y: -250}
                }));

                var degree = new ComponentView(new dataFlow.NumberComponent({
                    position: {x: 500, y: -250}
                }));

                var periodic = new ComponentView(new dataFlow.BooleanTrueComponent({
                    position: {x: 500, y: -450}
                }));


                var degree2 = new ComponentView(new dataFlow.NumberComponent({
                    position: {x: 500, y: 400}
                }));

                var controlCurve = new ComponentView(new dataFlow.CurveControlPointComponent({
                    position: {x: 1400, y: 200}
                }));

                var graftTree = new ComponentView(new dataFlow.Tree.GraftComponent({
                    position: {x: 500, y: 200}
                }));


                var circle = new ComponentView(new dataFlow.CircleCNRComponent({
                    position: {x: 2200, y: 250}
                }));

                /* Make connections between inputs and outputs of components */
                _.defer(function(){
                    point1.component["X"].connectOutput(number1.component.output);
                    point1.component["Y"].connectOutput(number2.component.output);
                    point1.component["Z"].connectOutput(number3.component.output);

                    // vector testing
                    vec1.component["X"].connectOutput(number1.component.output);
                    vec1.component["Y"].connectOutput(number2.component.output);
                    vec1.component["Z"].connectOutput(number3.component.output);
                    shift1.component["L"].connectOutput(point1.component.output);
                    vec2pt.component["A"].connectOutput(point1.component.output);
                    vec2pt.component["B"].connectOutput(shift1.component.output);
                    vecDisplay.component["V"].connectOutput(vec2pt.component.output);
                    vecDisplay.component["A"].connectOutput(point1.component.output);

                    curve.component["V"].connectOutput(point1.component.output);
                    curve.component["D"].connectOutput(degree.component.output);
                    curve.component["P"].connectOutput(periodic.component.output);

                    number1.component.output.assignValues([0,1,1,0,0,1,1,0,0,1]);
                    number2.component.output.assignValues([0,0,1,1,0,0,1,1,0,0]);
                    number3.component.output.assignValues([0.0,0.5,1,1.5,2,2.5,3,3.5,4,4.5]);

                    degree.component.output.assignValues([3]);
                    degree2.component.output.assignValues([1]);
                    //controlCurve.component["V"].connectOutput(point1.component.output);
                    controlCurve.component["D"].connectOutput(degree2.component.output);
                    controlCurve.component["P"].connectOutput(periodic.component.output);

                    workspace.render();
                });
            };

            App.prototype.displayControlPoly = function(ctrlpts){

                var endPointGeo = new THREE.Geometry();

                // construct geometry for control polygon
                for (var a = 0; a < ctrlpts.length; a++) {
                    var pt = ctrlpts[a].getCoordsArray();
                    endPointGeo.vertices.push(new THREE.Vector3(pt[0], pt[1], pt[2]));
                }

                var mat2 = new THREE.LineBasicMaterial({
                    color: 0x00fff0,
                });
                endPointGeo.computeLineDistances();
                var line2 = new THREE.Line(endPointGeo, new THREE.LineDashedMaterial( { color: 0xffaa00, dashSize: 0.1, gapSize: 0.1, linewidth: 2 } ), THREE.LineStrip);
                viewer.scene.add(line2);
            };

            return new App();
        }
    );
});
