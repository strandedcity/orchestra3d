require(["appconfig"],function(){
    require([
            "jquery",
            'SISL/sisl_loader',
            'dataFlow/dataFlow_loader',
            "viewer/modelView",
            "dataFlow/UI/workspaceView",
            "windowControls", // File, Model, Settings, Login, etc.... the top bar
            "dataFlow/UI/componentView"
        ],
        function(
            $,
            Geo,
            dataFlow,
            viewer,
            workspace,
            Nav,
            ComponentView
        ){
            function App(){
                viewer.createScene(); // viewer class shouldn't initialize itself; it should be testable without being in the DOM
                workspace.createWorkspace();

                // Create the navbar, and listen for it to add new components to the workspace
                var navbar = new Nav();
                navbar.on('createNewComponent',function(component){
                    new ComponentView(dataFlow.createComponentByName(component.functionName),{
                        position: {x: 0, y: 0}
                    });
                });

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
//                        var coords = pt.toArray();
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
                //this.NURBSCurveTest();
                this.loadJSONFileTest();

                viewer.render();
            };

            App.prototype.loadJSONFileTest = function(){
                $.get('curveWithVectorsTest.json?'+Math.random(),function(json){
                    // loading occurs in two stages since connections can't easily be made until all components are added
                    // first step: create each component, and keep track of EVERY IO as they go by so connections can be made directly
                    var IOIdsForConnections = {};
                    var connectionRoutes = [];
                    _.each(json,function(cpt){
                        var component = dataFlow.createComponentByName(cpt.componentName, _.clone(cpt));
                        new ComponentView(component);

                        // if the inputs are supposed to be connected to something, keep track of them for a moment
                        _.each(cpt.inputs,function(iptJSON){
                            if (iptJSON.connections.length > 0) {
                                IOIdsForConnections[iptJSON.id] = component[iptJSON.shortName];
                                _.each(iptJSON.connections,function(connectedIptId){
                                    var route = {};
                                    route[iptJSON.id] = connectedIptId;
                                    connectionRoutes.push(route);
                                });
                            }
                        });

                        // keep track of all outputs:
                        IOIdsForConnections[cpt.output[0].id] = component.output;

                    });

                    // To help the drawing along, it's easier for now to defer the connection making for one render cycle
                    _.defer(function() {
                        _.each(connectionRoutes,function(route){
                            var inputId = _.keys(route)[0],
                                outputId = route[inputId],
                                inputObject = IOIdsForConnections[inputId],
                                outputObject = IOIdsForConnections[outputId];

                            inputObject.connectAdditionalOutput(outputObject);
                        });
                    });
                });
            };

            App.prototype.NURBSCurveTest = function(){

                var components = [];

                var point1 = dataFlow.createComponentByName("PointComponent",{
                    position: {x: 500, y: 0}
                });
                components.push(point1);

                var vec1 = dataFlow.createComponentByName("VectorComponent",{
                    position: {x: 500, y: 550}
                });
                components.push(vec1);

                var vecDisplay = dataFlow.createComponentByName("VectorDisplayComponent",{
                    position: {x: 2200, y: 550}
                });
                components.push(vecDisplay);

                var shift1 = dataFlow.createComponentByName("ShiftComponent",{
                    position: {x: 1200, y: 750}
                });
                components.push(shift1);

                var vec2pt = dataFlow.createComponentByName("Vector2PtComponent",{
                    position: {x: 1700, y: 750}
                });
                components.push(vec2pt);


                var number1 = dataFlow.createComponentByName("NumberComponent",{
                    position: {x: -200, y: 100}
                });
                components.push(number1);

                var number2 = dataFlow.createComponentByName("NumberComponent",{
                    position: {x: -200, y: 0}
                });
                components.push(number2);

                var number3 = dataFlow.createComponentByName("NumberComponent",{
                    position: {x: -200, y: -100}
                });
                components.push(number3);


                var curve = dataFlow.createComponentByName("CurveControlPointComponent",{
                    position: {x: 1400, y: -250}
                });
                components.push(curve);


                var degree = dataFlow.createComponentByName("NumberComponent",{
                    position: {x: 500, y: -250}
                });
                components.push(degree);


                var periodic = dataFlow.createComponentByName("BooleanFalseComponent",{
                    position: {x: 500, y: -450}
                });
                components.push(periodic);


                var degree2 = dataFlow.createComponentByName("NumberComponent",{
                    position: {x: 500, y: 400}
                });
                components.push(degree2);

                var series = dataFlow.createComponentByName("SeriesComponent",{
                    position: {x: 1400, y: 200}
                });
                components.push(series);

                var graftTree = dataFlow.createComponentByName("GraftComponent",{
                    position: {x: 500, y: 200}
                });
                components.push(graftTree);


                var circle = dataFlow.createComponentByName("CircleCNRComponent",{
                    position: {x: 2200, y: 250}
                });
                components.push(circle);

                var slider1 = dataFlow.createComponentByName("SliderComponent",{
                    position: {x: -200, y: 400}
                });
                components.push(slider1);

                /////////////////////////////////////////////////////////////////////////////////
                // Show the UI for each component in the workspace:
                /////////////////////////////////////////////////////////////////////////////////
                _.each(components,function(cpt){
                    new ComponentView(cpt);
                });

                /* Make connections between inputs and outputs of components */
                _.defer(function(){
                    point1["X"].connectOutput(number1.output);
                    point1["Y"].connectOutput(number2.output);
                    point1["Z"].connectOutput(number3.output);

                    // vector testing
                    vec1["X"].connectOutput(number1.output);
                    vec1["Y"].connectOutput(number2.output);
                    vec1["Z"].connectOutput(number3.output);
                    shift1["L"].connectOutput(point1.output);
                    vec2pt["A"].connectOutput(point1.output);
                    vec2pt["B"].connectOutput(shift1.output);
                    vecDisplay["V"].connectOutput(vec2pt.output);
                    vecDisplay["A"].connectOutput(point1.output);

                    curve["V"].connectOutput(point1.output);
                    curve["D"].connectOutput(degree.output);
                    curve["P"].connectOutput(periodic.output);

                    number1.output.assignValues([0,1,1,0,0,1,1,0,0,1]);
                    number2.output.assignValues([0,0,1,1,0,0,1,1,0,0]);
                    number3.output.assignValues([0.0,0.5,1,1.5,2,2.5,3,3.5,4,4.5]);

                    degree.output.assignValues([3]);
                    degree2.output.assignValues([1]);

                    var jsonTotal = [];
                    _.each(components,function(cpt){
                        jsonTotal.push(cpt.toJSON());
                    });
                    console.log(JSON.stringify(jsonTotal));

                    workspace.render();
                });
            };

            App.prototype.displayControlPoly = function(ctrlpts){

                var endPointGeo = new THREE.Geometry();

                // construct geometry for control polygon
                for (var a = 0; a < ctrlpts.length; a++) {
                    var pt = ctrlpts[a].toArray();
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
