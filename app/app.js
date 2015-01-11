require(["appconfig"],function(){
    require([
            "jquery",
            'SISL/sisl_loader',
            'dataFlow/dataFlow_loader',
            "viewer/modelView",
            "dataFlow/UI/workspaceView",
            "navbar", // File, Model, Settings, Login, etc.... the top bar
            "dataFlow/UI/componentView",
            "dataFlow/project"
        ],
        function(
            $,
            Geo,
            dataFlow,
            viewer,
            workspace,
            Nav,
            ComponentView,
            OrchestraProject
        ){
            function App(){

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
                this.currentProject = null;
                _.bindAll(this,"newProject","save","loadJSONProject","loadParseProject","clearWorkspace");

                viewer.createScene(); // viewer class shouldn't initialize itself; it should be testable without being in the DOM
                workspace.createWorkspace();

                // Create the navbar, and listen for it to add new components to the workspace
                var that = this,
                    navbar = new Nav();

                // Navbar has a bunch of things that can interact with the workspaces:
                navbar.on('createNewComponent',function(component){
                    that.newComponent.call(that,component);
                }).on('openParseProject',function(projectId){
                    that.loadParseProject(projectId);
                }).on('openExampleProject',function(url){
                    that.loadJSONProject(url);
                }).on('saveCurrentProject',function(){
                    that.save();
                }).on('openNewProject',function(){
                    that.clearWorkspace();
                });

                // New components can be created directly in the workspace, as well as from the global nav:
                workspace.on('createNewComponent',function(component){
                    that.newComponent.call(that,component);
                });

                // Demonstration programs... Helpful to have handy for testing
                //this.NURBSCurveTest();
                //this.loadJSONProject('curveWithVectorsTest.json?');
                this.loadParseProject("JnbJpY8YjG");

                viewer.render();
            };

            App.prototype.newComponent = function(component){
                var position = component.position || workspace.getCurrentVisibleCenterPoint(),
                    cptObject = dataFlow.createComponentByName(component["functionName"],{
                        position: position
                    });
                this.currentProject.addComponentToProject(cptObject);
                new ComponentView(cptObject);
            };

            App.prototype.newProject = function(){
                console.log('UNIMPLEMENTED: NEW PROJECT')
            };

            App.prototype.clearWorkspace = function(){
                console.warn('DO SOME TESTS TO MAKE SURE THAT ZOMBIES DONT REMAIN');

                // We'll remove the views directly here, since we don't actually want to remmove the components from the project
                // model itself. That could cause weird behavior if a save occurred at the wrong moment, this is safer.
                if (!_.isNull(this.currentProject)) {
                    _.each(this.currentProject.get('components').slice(0),function(cpt){
                        cpt.componentView.remove();
                    });
                }

                this.currentProject = new OrchestraProject();

                // This is a pretty straightforward threejs scene. We can just remove things from it.
                viewer.clearScene();
                workspace.render(); // render workspace once to remove wires from view
            };

            App.prototype.save = function(){
                var proj = this.currentProject;
                if (_.isNull(proj)) throw new Error("No current project available to save");

                require(["dataFlow/projectLoader"],function(Loader){
                    Loader.saveProjectToParse(proj);
                });
            };

            App.prototype.loadParseProject = function(projectId){
                this.clearWorkspace();
                var that = this;
                require(["dataFlow/projectLoader"],function(Loader){
                    // no reference necessary. The slider will clean itself up.
                    Loader.loadProjectFromParse(projectId,function(proj){
                        that.loadWorkspace(proj);
                        console.log('\n\nLOADED PROJECT FROM PARSE');
                        //console.log(JSON.stringify(proj.toJSON())); // for saving local hard copy in a json file easily.
                    });
                });
            };

            App.prototype.loadJSONProject = function(url){
                this.clearWorkspace();
                var that = this;

                require(["dataFlow/projectLoader"],function(Loader){
                    Loader.loadProjectFromUrl(url,function(proj){
                        that.loadWorkspace(proj);
                        console.log('\n\nLOADED PROJECT FROM FILE');
                    });
                });
            };

            App.prototype.loadWorkspace = function(proj){
                this.currentProject = proj;

                // Draw Componets, Inputs and Outputs in workspace:
                _.each(proj.get('components'),function(cpt){
                    new ComponentView(cpt);
                });

                // CONNECTIONS between I/O's can't be drawn until all components have been drawn
                // (the views must exist before they can be connected)
                // TODO: ELIMINATE THIS DEFER STATEMENT -- PERHAPS WITH A PROMISE? PERHAPS BY SETTING THE IOVIEW PROPERTY SYNCHRONOUSLY
                // TODO: THEN PUTTING THE _.DEFER STATEMENT INSIDE THE DRAWALLCONNECTIONS FUNCTION?
                _.defer(function(){
                    _.each(proj.get('components'),function(cpt){
                        _.each(cpt.inputs,function(ipt){
                            var inputView = ipt.IOView;
                            if (inputView) {
                                inputView.drawAllConnections();
                            }
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
