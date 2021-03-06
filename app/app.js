require(["appconfig"],function(){
    require([
            "jquery",
            'SISL/sisl_loader',
            'dataFlow/dataFlow_loader',
            "viewer/modelView",
            "viewer/fileExporter",
            "dataFlow/UI/workspaceView",
            "navbar", // File, Model, Settings, Login, etc.... the top bar
            "dataFlow/UI/componentView",
            "dataFlow/project",
            "dataFlow/pulse"
        ],
        function(
            $,
            Geo,
            dataFlow,
            viewer,
            FileExporter,
            workspace,
            Nav,
            ComponentView,
            OrchestraProject,
            Pulse
        ){
            var prevTimeStamp = 0, events = [];
            window.LOG_TIME_EVENT = function(eventName, end){
                var timestamp = (new Date()).getTime();
                var timeobj = {};
                timeobj[eventName] = timestamp - prevTimeStamp;
                events.push(timeobj);
                prevTimeStamp = timestamp;

                if (end) {
                    //console.log(JSON.stringify(events).toString().replace(/},{/g,"\n"));
                    prevTimeStamp = 0;
                    events = [];
                }
            };

            function App(){

                this.init();
            }

            App.prototype.init = function(){
                this.currentProject = null;
                _.bindAll(this,
                    "newProject",
                    "save",
                    "loadJSONProject",
                    "loadParseProject",
                    "clearWorkspace",
                    "initializeViewer",
                    "setupDemoMode"
                );

                viewer.createScene(); // viewer class shouldn't initialize itself; it should be testable without being in the DOM
                workspace.createWorkspace();
                this.exporter = FileExporter(viewer);

                // Create the navbar, and listen for it to add new components to the workspace
                var that = this,
                    navbar = new Nav();
                this.navbar = navbar;

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
                    that.newProject();
                });

                // New components can be created directly in the workspace, as well as from the global nav:
                workspace.on('createNewComponent',function(component){
                    that.newComponent.call(that,component);
                });

                viewer.render();
            };

            App.prototype.newComponent = function(component){
                var that=this,
                    position = component.position || workspace.getCurrentVisibleCenterPoint(),
                        cptObject = dataFlow.createComponentByName(component["functionName"],{
                            position: position
                        });
                this.currentProject.addComponentToProject(cptObject);

                // Handle "bake" equivalents: export STL, SVG, OBJ, Rendered Image, etc
                cptObject.on('requestFileExport',function(o){that.exporter.export(o);});
                
                new ComponentView(cptObject);
            };

            App.prototype.newProject = function(){
                this.clearWorkspace();
                this.loadWorkspace(this.currentProject);
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
                require(["dataFlow/projectLoader"],function(Loader){
                    Loader.clearCurrentProject();
                });

                // This is a pretty straightforward threejs scene. We can just remove things from it.
                viewer.clearScene();
                workspace.render(); // render workspace once to remove wires from view
            };

            App.prototype.save = function(){
                var proj = this.currentProject,
                    that=this;
                if (_.isNull(proj)) throw new Error("No current project available to save");

                require(["dataFlow/projectLoader"],function(Loader){
                    Loader.saveProjectToParse(proj,that.getDisplayState());
                });
            };

            App.prototype.getDisplayState = function(){
                return {
                    workspace: workspace.toJSON(),
                    viewer: viewer.toJSON()
                }
            };

            App.prototype.setupDemoMode = function(){
                console.warn("TODO: Visual indicators for demo mode.");

                // Load a list of available sample projects instead of "this user's" projects

                // Show Orientation

                // Show "DEMO" Flag in the corner

                // Load sample project du jour

                this.loadJSONProject.call(this,'example_gridOfPoints_attractorField.json?');
            };

            App.prototype.initializeViewer = function(proj){
                this.loadWorkspace(proj);

                console.warn('window.frozen = false');
                window.frozen = false;

                // Trigger "change" events on components with inputs without connections, one per component
                // These are the beginnings of the "graph"
                _.each(proj.get('components'),function(cpt){
                    var disconnectedCount = 0;
                    _.each(cpt.inputs,function(ipt){
                        if (  _.keys(ipt._listeningTo).length === 0 && !ipt.getTree().isEmpty()) {
                            disconnectedCount++;
//                                    console.log('triggering change on '+ipt.shortName+cpt.get('componentPrettyName'));
//                                    ipt.trigger("change");
                        } else if (ipt.get('invisible') === true) {
                            disconnectedCount++;
                        }
                    });

                    // if all inputs to a component are disconnected, trigger a pulse
                    // to make sure the component recalculates now that all conections are in place
                    if (disconnectedCount === cpt.inputs.length) {
                        //console.log('master trigger now');
                        var start = cpt.inputs[0];
                        start.trigger('pulse',new Pulse({startPoint:start}));
                    }
                });

                if (proj.get('contextData')) {
                    viewer.fromJSON(proj.get('contextData')["viewer"]);
                }

                //console.log(JSON.stringify(proj.toJSON())); // for saving local hard copy in a json file easily.
            };

            App.prototype.loadParseProject = function(projectId){
                console.warn('window.frozen = true');
                window.frozen = true;
                this.clearWorkspace();
                var that = this;
                require(["dataFlow/projectLoader"],function(Loader){
                    // no reference necessary. The slider will clean itself up.
                    Loader.loadProjectFromParse(projectId)
                        .then(function(proj){
                            console.log('\n\nLOADED PROJECT FROM PARSE');

                            that.initializeViewer.call(that,proj);
                        })
                        .fail(function(e){
                            if (e && e.code === 100) {
                                // Server is unavailable. This is a fatal error, but for right now let's just enter demo mode
                                alert("Server Unavailable. Entering Demo Mode.");
                                that.setupDemoMode();
                            } else {
                                alert("Unknown fatal error. See console for more info.");
                                console.log("Error details while trying to load project from Parse Server:");
                                console.log(e);
                            }
                        });
                });
            };

            App.prototype.loadJSONProject = function(url){
                this.clearWorkspace();
                var that = this;

                require(["dataFlow/projectLoader"],function(Loader){
                    Loader.loadProjectFromUrl(url,function(proj){
                        console.log('\n\nLOADED PROJECT FROM FILE');

                        that.initializeViewer.call(that,proj);
                    });
                });
            };

            App.prototype.loadWorkspace = function(proj){
                var that = this;
                this.navbar.setProject(proj);
                this.currentProject = proj;

                // Draw Componets, Inputs and Outputs in workspace:
                _.each(proj.get('components'),function(cpt){
                    // Attach file export capabilities
                    cpt.on('requestFileExport',function(o){that.exporter.export(o);});

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

                if (proj.get('contextData')) {
                    workspace.fromJSON(proj.get('contextData')["workspace"]);
                }
            };

            return new App();
        }
    );
});
