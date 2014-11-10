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

                /* Make connections between inputs and outputs of components */
                _.defer(function(){
                    //point1.component["X"].connectOutput(number1.component.output);
                    point1.component["Y"].connectOutput(number2.component.output);
                    point1.component["Z"].connectOutput(number3.component.output);
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

                    //that.displayControlPoly(curve.component["V"].fetchValues());
                    //that.displaySISLTestCurve(curve.component.output.fetchValues()[0]);

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
