require(["appconfig"],function(){
    require([
            'SISL/sisl_loader',
            'dataFlow/dataFlow_loader',
            "viewer/init",
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
                this.init();
            }

            App.prototype.init = function(){
                // Activate only one at a time, maybe? In any case, global controls:
                //workspace.enableControls(false);
                //viewer.enableControls(true);

                // Demonstration programs...
                this.showSISLTestCurve();
                //this.showDataflowTestComponents();
                this.NURBSCurveTest();
            };

            App.prototype.NURBSCurveTest = function(){
                var point1 = new ComponentView(new dataFlow.PointComponent({
                    position: {x: 500, y: 0}
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
                    position: {x: 1000, y: -250}
                }));

                var degree = new ComponentView(new dataFlow.NumberComponent({
                    position: {x: 500, y: -250}
                }));

                var periodic = new ComponentView(new dataFlow.BooleanTrueComponent({
                    position: {x: 500, y: -450}
                }));
            };

            App.prototype.showDataflowTestComponents = function(){
                var pointxyz = workspace.createComponentWithNamePosition("Point (x,y,z)", 200, 0);
                var pointX = workspace.createInputWithNameAndParent("x","num",pointxyz,60);
                workspace.createInputWithNameAndParent("y","num",pointxyz,0);
                workspace.createInputWithNameAndParent("z","num",pointxyz,-60);
                workspace.createOutputWithNameAndParent("pt","point",pointxyz,0);

                var number1 = workspace.createComponentWithNamePosition("Number",-300,-200);
                var number1Out = workspace.createOutputWithNameAndParent("#","num",number1,0);

                var number2 = workspace.createComponentWithNamePosition("Number",-350,-50);
                workspace.createOutputWithNameAndParent("#","num",number2,0);

                var number3 = workspace.createComponentWithNamePosition("Number",-400,300);
                workspace.createOutputWithNameAndParent("#","num",number3,0);

                workspace.render();

                // Test drawing a line between components. Must find a way for this line to auto-update when components move...
                var that = workspace;
                _.defer(function(){

                    // Makes the I/O's move with their wires AND the components they're attached to. Seems really inefficient though.
                    that.glObjectsByCSSId[pointxyz.uuid].addEventListener("changePosition",function(){
                        that.glObjectsByCSSId[pointX.uuid].dispatchEvent({ type: 'changeComponentPosition' });
                    });
                    that.glObjectsByCSSId[number1.uuid].addEventListener("changePosition",function(){
                        that.glObjectsByCSSId[number1Out.uuid].dispatchEvent({ type: 'changeComponentPosition' });
                    });




                    // Create the curved connection. Because the curves will be "oriented" it's important to start at the OUTPUT of the component
                    // and end at the INPUT of the connected component.
                    var startVectWorld = new THREE.Vector3();
                    startVectWorld.setFromMatrixPosition(number1Out.matrixWorld);// number1Out

                    var endVectorWorld = new THREE.Vector3();
                    endVectorWorld.setFromMatrixPosition(pointX.matrixWorld);

                    var mesh = that.drawCurveFromPointToPoint(startVectWorld, endVectorWorld);

                    that.glObjectsByCSSId[pointX.uuid].addEventListener('changeComponentPosition',function(e){
                        // Adjust the curved connection during drag events for each end
                        endVectorWorld.setFromMatrixPosition(this.matrixWorld);
                        that.drawCurveFromPointToPoint(startVectWorld, endVectorWorld, mesh);
                        _.defer(function(){that.render()});
                    });
                    that.glObjectsByCSSId[number1Out.uuid].addEventListener('changeComponentPosition',function(e){
                        startVectWorld.setFromMatrixPosition(this.matrixWorld);
                        that.drawCurveFromPointToPoint(startVectWorld, endVectorWorld, mesh);
                        _.defer(function(){that.render()}); // necessary so that wires are re-drawn after drop events
                    });

                    that.glscene.add(mesh);

                    that.render();
                });

            };

            App.prototype.showSISLTestCurve = function(){
                // Mirrors the curve specified in example01.cpp. NOT the same as the example images on SINTEF website!
                var p0 = new Geo.Point(0, 0, 0),
                    p1 = new Geo.Point(1, 0, 0.5),
                    p2 = new Geo.Point(1, 1, 1),
                    p3 = new Geo.Point(0, 1, 1.5),
                    p4 = new Geo.Point(0, 0, 2),
                    p5 = new Geo.Point(1, 0, 2.5),
                    p6 = new Geo.Point(1, 1, 3),
                    p7 = new Geo.Point(0, 1, 3.5),
                    p8 = new Geo.Point(0, 0, 4),
                    p9 = new Geo.Point(1, 0, 4.5),

                // Create the SISL Curve:
                    curve = new Geo.Curve([p0, p1, p2, p3, p4, p5, p6, p7, p8, p9], 3, false);

                // For illustration -- show the control polygon
                var ctrlpts = [p0, p1, p2, p3, p4, p5, p6, p7, p8, p9];

                var material = new THREE.LineBasicMaterial({
                    color: 0xff00f0,
                });

                var geometry = new THREE.Geometry();

                // Curves parameterized 0 --> 1.
                // Step through parameters to get points, draw connecting lines
                // SHOULD INCLUDE SOMETHING ABOUT PRECISION!
                for (var i = 0; i < 1; i += 0.01) {
                    var pt = curve.getPositionAt(i).getCoordsArray();
                    geometry.vertices.push(new THREE.Vector3(pt[0], pt[1], pt[2]));
                }

                var line = new THREE.Line(geometry, material);
                viewer.scene.add(line);

                var endPointGeo = new THREE.Geometry();

                // construct geometry for control polygon
                for (var a = 0; a < ctrlpts.length; a++) {
                    var pt = ctrlpts[a].getCoordsArray();
                    endPointGeo.vertices.push(new THREE.Vector3(pt[0], pt[1], pt[2]));
                }

                var mat2 = new THREE.LineBasicMaterial({
                    color: 0x00fff0,
                });
                var line2 = new THREE.Line(endPointGeo, mat2);
                viewer.scene.add(line2);
                viewer.render();
            };

            return new App();
        }
    );
});
