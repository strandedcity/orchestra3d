// To reduce dependencies somewhat while still keeping the UI Usable in terms of regular DOM drag events, input fields, etc, requires some invention
// Something will need to draw the connections between elements, and while canvas seems the obvious choice for such a task, that would
// require us to include an entire extra library (probably KineticJS) to handle the canvas drawing, or we'd have to draw it all ourselves.
// Fortunagely, threejs presents a viable CSS3 Rendering alternative. We can use regular DOM objects and throw them into an interactive scene
// controlled by three.js. Regular DOM drag-n-drop will be available, as well as regular form input behavior. But drawing connecting lines can then happen snappily in threejs.
//
// See http://learningthreejs.com/blog/2013/04/30/closing-the-gap-between-html-and-webgl/
define([
    "threejs",
    "CSS3DRenderer",
    "OrbitControls",
    "underscore",
    "backbone"
],function(){

    // Helpers for drag-and-drop scopes
    _.extend(THREE.CSS3DObject.prototype,Backbone.Events,{
        addDraggableScopes: function(scopes){
            this.draggableScopes = _.union(this.draggableScopes || [],scopes);
        },
        addDroppableScopes: function(scopes){
            this.dropableScopes = _.union(this.dropableScopes || [],scopes);
        },
        getDroppableScopes: function(){
            return this.dropableScopes || [];
        },
        getDraggableScopes: function(){
            return this.draggableScopes || [];
        },
        isDroppableForScopes: function(scopeNames){
            // "input" or "output" is required to match
            if ( this.getDroppableScopes().indexOf("input") !== -1 && scopeNames.indexOf("input") === -1){  return false; }
            else if (this.getDroppableScopes().indexOf("output") !== -1 && scopeNames.indexOf("output") === -1) { return false; }

            // all IOs are droppable for "wild" draggables so long as the input/output scopes match up
            if (scopeNames.indexOf("wild") > -1 || this.getDraggableScopes().indexOf("wild") > -1 ) {return true;}

            // to be a valid drop target, the input/output setting must match PLUS at least one other scope.
            return  _.without(_.intersection(this.getDroppableScopes(),scopeNames),"input","output").length > 0;
        },
        dropObject: function(connection){
            // handles "drop" events. When one object is dropped on another, connectObject will be called on the INPUT object only.
            // "input" objects listen to pulse events (recalculations) on "output" objects. So only the
            // "input" side actually does anything with this
            this.trigger("drop",connection);
        }
    });

    _.extend(THREE.Mesh.prototype,Backbone.Events,{
        setHomePosition: function(){
            this.homePosition = this.position.clone();
        },
        getHomePosition: function(){
            return this.homePosition;
        }
    });


    function Workspace(){
        this.init();
    };

    Workspace.prototype.init = function(){

        // drag and drop related
        _.bindAll(this, "drag", "render", "mouseUp", "clearHover","setupDraggableView","startDraggingObject");
        this.dragObject = null;
        this.dragOffset = [0,0];

        this.width = window.innerWidth / 2;
        this.height = window.innerHeight;

        /* THIS IS IMPORTANT! Large "far" value keeps connection curves from disappearing when you zoom way out on the workspace. */
        this.camera = new THREE.PerspectiveCamera( 70, this.width / this.height, 1, 1000000 );
        this.camera.position.z = 1200;

        //this.createWorkspace(); // Done on the application level to avoid rendering the workspace during tests
    };

    Workspace.prototype.createWorkspace = function(){
        // GL scene handles drag & drop, mouse/touch events, and drawing of connections
        this.glscene = new THREE.Scene();
        this.glrenderer = new THREE.WebGLRenderer();
        this.glrenderer.setSize( this.width, this.height );
        document.body.appendChild( this.glrenderer.domElement );
        this.glrenderer.domElement.className = "TOP";

        // CSS scene handles standard DOM elements and styling, such as <input> fields, drop-downs, etc.
        this.scene = new THREE.Scene();
        this.renderer = new THREE.CSS3DRenderer({ alpha: true });
        this.renderer.setSize( this.width, this.height );
        document.body.appendChild( this.renderer.domElement );
        this.renderer.domElement.className = "TOP";

        this.attachControls();
    };

    Workspace.prototype.render = function(){
        this.renderer.render(this.scene,this.camera);
        this.glrenderer.render(this.glscene,this.camera);
    };

    Workspace.prototype.attachControls = function(){
        this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
        this.controls.noRotate = true;
        this.controls.zoomSpeed = 2.0;
        this.controls.addEventListener( 'change', this.render );
        this.render();
    };

    Workspace.prototype.enableControls = function(value){
        this.controls.enabled = value;
    };





    /* Drag and drop */
    Workspace.prototype.mouseUp = function(event){
        if (!_.isNull(this.dragObject)) {
            // io's, return home
            var home = this.glDragObject.getHomePosition();
            if (!_.isUndefined(home)) {
                this.dragObject.position.set(home.x,home.y,0);
                this.glDragObject.position.set(home.x,home.y,0);
                this.glDragObject.updateMatrixWorld(); // so that wires are drawn to the new position, not the old one, even in the same render frame
                this.glDragObject.trigger("changePosition");
                this.render(); // so that if no wires are connected, the element still visually returns home
            }

            if (!_.isNull(this.hoverObject)) {
                // can't assume that user is hovering an output over an input. You can drag either direction, but the connection is only made
                // in one direction (inputs listen to outputs, outputs have no refs to inputs)
                if (this.hoverObject.getDroppableScopes().indexOf("output") !== -1) {
                    this.hoverObject.dropObject(this.dragObject);
                } else {
                    this.dragObject.dropObject(this.hoverObject);
                }
            }

            this.dragObject = null;
            this.glDragObject = null;
            this.dragOffset = {};
            this.renderer.domElement.removeEventListener("mousemove",this.drag);
            this.renderer.domElement.removeEventListener("mouseup",this.mouseUp);
        };

        if (!_.isNull(this.hoverObject)) this.clearHover();
    };

    Workspace.prototype.startDraggingObject = function(e){
        this.renderer.domElement.addEventListener("mousemove",this.drag);
        this.renderer.domElement.addEventListener("mouseup",this.mouseUp);

        var unprojectedVector = this.unprojectMouse(e.clientX, e.clientY),
            mousePosition = this.mouseWorldXYPosition(unprojectedVector);

        // the three.js object id is passed back by the start drag event.
        this.dragObject = e.object.cssObject;
        this.glDragObject = e.object.glObject;
        this.hoverObject = null;
        this.glHoverObject = null;

        // the "offset" here refers to the x,y offset between the mouse pointer in currently-zoomed world coordinates
        // and the center of the dragging object
        this.dragOffset = {x: mousePosition.x - this.dragObject.position.x, y: mousePosition.y - this.dragObject.position.y};

        // store the list of intersection objects once to avoid doing it on every move event. Don't intersect with the object you're dragging.
        this.intersectionObjects = this.computeDroppableObjects();
    };

    /* Never intended to be used by the workspace itself, this is a mixin for "draggables" from other classes */
    Workspace.prototype.setupDraggableView = function(view){
        if (_.isUndefined(view.cssObject) || _.isUndefined(view.glObject)) throw new Error("Draggable views must have both cssObject and glObject properties");

        var that = this;
        view.cssObject.element.addEventListener("mousedown",onMouseDown);
        view.cssObject.element.addEventListener("mouseup",onMouseUp);
        view.cssObject.element.addEventListener("mouseout",onMouseOut);

        // Timeout, started on mousedown, triggers the beginning of a hold
        var holdStarter = null,
            holdDelay = 200,
            holdActive = false;

        function onMouseDown(e){
            if ( e.button !== 0 ) return; // left mouse button only
            if ( that.controls.enabled === false ) return; // ignore events if the workspace is disabled

            // start dragging right away. If you drop quickly enough, the event will turn into a click event after the fact!
            e.object = view; // add the view to the drag event
            that.startDraggingObject(e);

            holdStarter = setTimeout(function() {
                holdStarter = null;
                holdActive = true;
                console.log("DRAG");
            }, holdDelay);
        }
        function onMouseUp(){
            if (holdStarter) {
                clearTimeout(holdStarter);
                holdStarter = null;
                console.log("CLICK");
            }
            else if (holdActive) {
                holdActive = false;
                console.log("DROP");
            }
        }
        function onMouseOut(){
            onMouseUp();
        }
    };

    Workspace.prototype.computeDroppableObjects = function(){
        var droppables = [];
        var draggableScopes = this.dragObject.getDraggableScopes();

        var that = this;

        // a little messy recursion here to make sure we intersect with GL Objects' children
        function testAndAdd(glObject){
            if (glObject !== that.glDragObject && glObject !== that.glscene && !_.isUndefined(glObject.IOView)) { // draggable never droppable on itself
                if (glObject.IOView.cssObject.isDroppableForScopes(draggableScopes)){
                    droppables.push(glObject);
                }
            }
            _.each(glObject.children,testAndAdd);
        }
        testAndAdd(that.glscene);

        return droppables;
    };

    Workspace.prototype.drag = function(e){
        event.preventDefault(); // prevent flickering when dragging over other objects
        var unprojectedVector = this.unprojectMouse(e.clientX, e.clientY);
        var worldPosition = this.mouseWorldXYPosition(unprojectedVector);
        this.dragObject.position.set(worldPosition.x - this.dragOffset.x, worldPosition.y - this.dragOffset.y, 0);
        this.glDragObject.position.set(worldPosition.x - this.dragOffset.x, worldPosition.y - this.dragOffset.y, 0);
        this.glDragObject.trigger("changePosition");
        this.findIntersections(unprojectedVector);
        this.render();
    };

    Workspace.prototype.unprojectMouse = function(x,y){
        var projector = new THREE.Projector();

        var vector = new THREE.Vector3(
                ( x / this.glrenderer.domElement.clientWidth ) * 2 - 1,
                - ( y / this.glrenderer.domElement.clientHeight ) * 2 + 1,
            0.5 );

        projector.unprojectVector( vector, this.camera );

        return vector
    };

    Workspace.prototype.mouseWorldXYPosition = function(unprojected){
        // figure out world XY position of clientX clientY of current drag event position. Broadcast as an event.
        // drag and drop should not be handled by orbitControls, but it can provide the basic functionality to build off of

        if ( this.camera.fov !== undefined ) {
            var dir = unprojected.clone().sub( this.camera.position ).normalize();
            var distance = - this.camera.position.z  / dir.z;

            return this.camera.position.clone().add( dir.multiplyScalar( distance ) );
        }
    };

    Workspace.prototype.findIntersections = function(unprojectVector){
        var ray = new THREE.Raycaster( this.camera.position, unprojectVector.clone().sub( this.camera.position ).normalize() );

        // create an array containing all objects in the scene with which the ray intersects
        var intersects = ray.intersectObjects( this.intersectionObjects, true );

        if (intersects.length > 0 && _.isNull(this.hoverObject)) {
            // TODO: What happens with multiple intersection objects? Handling multiples here can result in some 'stuck' hover classes being added
            var intersection = intersects[0];
            this.glHoverObject = intersection.object;
            this.hoverObject = intersection.object.IOView.cssObject;
            this.hoverObject.element.className += ' glHover';
        }

        if (!_.isNull(this.hoverObject) && (intersects.length === 0 || intersects[0].object !== this.glHoverObject) ) this.clearHover();
    };

    Workspace.prototype.clearHover = function(){
        // clear hover status
        this.hoverObject.element.className = this.hoverObject.element.className.replace(' glHover','');
        this.glHoverObject = null;
        this.hoverObject = null;
    };

    Workspace.prototype.drawCurveFromPointToPoint = function(startPoint,endPoint, mesh){
        // Smoothness of connecting curves.
        var numPoints = 30;

        // calculate intermediate point positions:
        var minControlpointDist = Math.min(200,Math.sqrt( Math.pow((endPoint.x - startPoint.x),2) + Math.pow((endPoint.y - startPoint.y),2)  ));
        var m1 = new THREE.Vector3(Math.max(startPoint.x +minControlpointDist,startPoint.x + 2*(endPoint.x - startPoint.x)/3), startPoint.y , 0),
            m2 = new THREE.Vector3(Math.min(endPoint.x-minControlpointDist,endPoint.x - 2*(endPoint.x - startPoint.x)/3), endPoint.y, 0),
            spline = new THREE.CubicBezierCurve3(
                startPoint,
                m1,
                m2,
                endPoint
            );

        var createNew = _.isUndefined(mesh),
            geometry = createNew ? new THREE.Geometry : mesh.geometry,
            splinePoints = spline.getPoints(numPoints);

        // approximate the curve in numPoints line segments
        for(var i = 0; i < splinePoints.length; i++){
            geometry.vertices[i]=splinePoints[i];
        }

        // For re-used meshes: https://github.com/mrdoob/three.js/wiki/Updates
        geometry.verticesNeedUpdate = true;

        if (createNew) {
            var material = new THREE.LineBasicMaterial({ color: 0xffffff });
            var mesh = new THREE.Line(geometry, material);
            mesh.frustumCulled = false; /* THIS IS IMPORTANT! It keeps the lines from disappearing when (0,0,0) goes offscreen due to a pan! */
        }

        return mesh;
    };

    return new Workspace();
});
