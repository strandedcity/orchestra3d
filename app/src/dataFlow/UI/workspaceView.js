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
    "underscore"
],function(){

    // Helpers for drag-and-drop scopes
    _.extend(THREE.CSS3DObject.prototype,{
        addDraggableScopes: function(scopes){
            this.draggableScopes = this.draggableScopes || [];
            this.draggableScopes = _.union(this.draggableScopes,scopes);
        },
        addDroppableScopes: function(scopes){
            this.dropableScopes = this.dropableScopes || [];
            this.dropableScopes = _.union(this.dropableScopes,scopes);
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

            // to be a valid drop target, the input/output setting must match PLUS at least one other scope.
            return  _.without(_.intersection(this.getDroppableScopes(),scopeNames),"input","output").length > 0;
        }
    });

    _.extend(THREE.Mesh.prototype,{
        setHomePosition: function(){
            this.homePosition = this.position.clone();
        },
        getHomePosition: function(){
            return this.homePosition;
        }
    });


    function Workspace(){
        this.dragObject = null;
        this.init();
    };

    Workspace.prototype.init = function(){
        // "Global" dictionary to store draggable objects across two threejs scenes: a CSS scene and a WebGL scene
        this.objectDictionary = {}; // find any object from its UUID, regardless of the scene it's in
        this.cssObjectsByGLId = {}; // look up a CSS object from the id of the corresponding GL object
        this.glObjectsByCSSId = {}; // look up a GL object from the id of its corresponding CSS object

        // drag and drop related
        _.bindAll(this, "startDrag", "drag", "render","createComponentWithNamePosition", "createGLElementToMatch","_createIOWithNameAndParent", "mouseDown", "mouseUp", "clearHover");
        this.dragObject = null;
        this.dragOffset = [0,0];

        var width = window.innerWidth / 2,
            height = window.innerHeight;
        /* THIS IS IMPORTANT! Large "far" value keeps connection curves from disappearing when you zoom way out on the workspace. */
        this.camera = new THREE.PerspectiveCamera( 70, width / height, 1, 1000000 );
        this.camera.position.z = 800;

        // GL scene handles drag & drop, mouse/touch events, and drawing of connections
        this.glscene = new THREE.Scene();
        this.glrenderer = new THREE.WebGLRenderer();
        this.glrenderer.setSize( width, height );
        document.body.appendChild( this.glrenderer.domElement );
        this.glrenderer.domElement.className = "TOP";

        // CSS scene handles standard DOM elements and styling, such as <input> fields, drop-downs, etc.
        this.scene = new THREE.Scene();
        this.renderer = new THREE.CSS3DRenderer({ alpha: true });
        this.renderer.setSize( width, height );
        document.body.appendChild( this.renderer.domElement );
        this.renderer.domElement.className = "TOP";

        this.attachControls();

        // for testing!
        this.testElement();
    };

    Workspace.prototype.testElement = function(){

        var pointxyz = this.createComponentWithNamePosition("Point (x,y,z)", 200, 0);
        var pointX = this.createInputWithNameAndParent("x","num",pointxyz,60);
        this.createInputWithNameAndParent("y","num",pointxyz,0);
        this.createInputWithNameAndParent("z","num",pointxyz,-60);
        this.createOutputWithNameAndParent("pt","point",pointxyz,0);

        var number1 = this.createComponentWithNamePosition("Number",-300,-200);
        var number1Out = this.createOutputWithNameAndParent("#","num",number1,0);

        var number2 = this.createComponentWithNamePosition("Number",-350,-50);
        this.createOutputWithNameAndParent("#","num",number2,0);

        var number3 = this.createComponentWithNamePosition("Number",-400,300);
        this.createOutputWithNameAndParent("#","num",number3,0);

        this.render();

        // Test drawing a line between components. Must find a way for this line to auto-update when components move...
        var that = this;
        _.defer(function(){

            // Makes the I/O's move with their wires AND the components they're attached to. Seems really inefficient though.
            that.glObjectsByCSSId[pointxyz.uuid].addEventListener("changePosition",function(){
                that.glObjectsByCSSId[pointX.uuid].dispatchEvent({ type: 'changePosition' });
            });
            that.glObjectsByCSSId[number1.uuid].addEventListener("changePosition",function(){
                that.glObjectsByCSSId[number1Out.uuid].dispatchEvent({ type: 'changePosition' });
            });




            // Create the curved connection. Because the curves will be "oriented" it's important to start at the OUTPUT of the component
            // and end at the INPUT of the connected component.
            var startVectWorld = new THREE.Vector3();
            startVectWorld.setFromMatrixPosition(number1Out.matrixWorld);// number1Out

            var endVectorWorld = new THREE.Vector3();
            endVectorWorld.setFromMatrixPosition(pointX.matrixWorld);

            var mesh = that.drawCurveFromPointToPoint(startVectWorld, endVectorWorld);

            that.glObjectsByCSSId[pointX.uuid].addEventListener('changePosition',function(e){
                // Adjust the curved connection during drag events for each end
                endVectorWorld.setFromMatrixPosition(this.matrixWorld);
                that.drawCurveFromPointToPoint(startVectWorld, endVectorWorld, mesh);
                _.defer(function(){that.render()});
            });
            that.glObjectsByCSSId[number1Out.uuid].addEventListener('changePosition',function(e){
                startVectWorld.setFromMatrixPosition(this.matrixWorld);
                that.drawCurveFromPointToPoint(startVectWorld, endVectorWorld, mesh);
                _.defer(function(){that.render()}); // necessary so that wires are re-drawn after drop events
            });

            that.glscene.add(mesh);

            that.render();
        });
    };

    Workspace.prototype.drawCurveFromPointToPoint = function(startPoint,endPoint, mesh){
        // Smoothness of connecting curves.
        var numPoints = 30;

        // calculate intermediate point positions:
        var m1 = new THREE.Vector3(Math.max(startPoint.x +200,startPoint.x + 2*(endPoint.x - startPoint.x)/3), startPoint.y , 0),
            m2 = new THREE.Vector3(Math.min(endPoint.x-200,endPoint.x - 2*(endPoint.x - startPoint.x)/3), endPoint.y, 0),
            spline = new THREE.CubicBezierCurve3(
                startPoint,
                m1,
                m2,
                endPoint
            );

        var material = new THREE.LineBasicMaterial({
            color: 0xffffff
        });

        var geometry, splinePoints = spline.getPoints(numPoints);
        if (_.isUndefined(mesh)) {
            geometry = new THREE.Geometry();
            for(var i = 0; i < splinePoints.length; i++){
                geometry.vertices.push(splinePoints[i]);
            }
            var newMesh = new THREE.Line(geometry, material);
            newMesh.frustumCulled = false; /* THIS IS IMPORTANT! It keeps the lines from disappearing when (0,0,0) goes offscreen due to a pan! */
            return newMesh;
        } else {
            geometry = mesh.geometry;
            for(var i = 0; i < splinePoints.length; i++){
                geometry.vertices[i]=splinePoints[i];
            }

            //https://github.com/mrdoob/three.js/wiki/Updates
            geometry.verticesNeedUpdate = true;
            return mesh;
        }
    };

    Workspace.prototype.createComponentWithNamePosition = function(name, x, y){
        var element = document.createElement( 'div' );
        element.className = 'draggable';

        var number = document.createElement( 'input' );
        number.type = "text";
        number.className = 'number';
        number.value = name;
        element.appendChild( number );

        var cssObject = new THREE.CSS3DObject( element );
        cssObject.position.x = x || 0;
        cssObject.position.y = y || 0;
        cssObject.position.z = 0;

        this.scene.add(cssObject);
        element.uuid = cssObject.uuid; // so the object is identifiable later for drag/drop operations
        this.objectDictionary[cssObject.uuid] = cssObject;
        var that = this;
        _.defer(function(){
            that.createGLElementToMatch(cssObject);
        });

        return cssObject;
    };

    Workspace.prototype._createIOWithNameAndParent = function(name, parentCSSElement, verticalOffset){
        var element = document.createElement("div");
        element.className = 'draggable IO';
        element.textContent = name;
        parentCSSElement.element.appendChild(element);

        var cssObject = new THREE.CSS3DObject( element );

        this.objectDictionary[cssObject.uuid] = cssObject;
        parentCSSElement.add(cssObject);

        var that = this;
        _.defer(function(){that.createGLElementToMatch( cssObject );});

        cssObject.position.z = 0;
        cssObject.position.y = verticalOffset;
        return cssObject;
    };
    Workspace.prototype.createInputWithNameAndParent = function(name, dragScope, parentCSSElement,verticalOffset){
        var ioElement = this._createIOWithNameAndParent(name,parentCSSElement, verticalOffset);
        ioElement.position.x = -150;
        ioElement.element.className += ' inputIO';
        ioElement.addDraggableScopes(["input",dragScope]);
        ioElement.addDroppableScopes(["output",dragScope]);
        var that = this;
        _.defer(function(){
            var glObject = that.createGLElementToMatch(ioElement);

            // snap-back behavior requires IO elements to know their own home positions
            // note that these positions will be with reference to the parent, not the world.
            glObject.setHomePosition();
        });
        return ioElement;
    };
    Workspace.prototype.createOutputWithNameAndParent = function(name, dragScope, parentCSSElement,verticalOffset){
        var ioElement = this._createIOWithNameAndParent(name,parentCSSElement, verticalOffset);
        ioElement.position.x = 150;
        ioElement.element.className += ' outputIO';
        ioElement.addDroppableScopes(["input",dragScope]);
        ioElement.addDraggableScopes(["output",dragScope]);
        var that = this;
        _.defer(function(){
            var glObject = that.createGLElementToMatch(ioElement);

            // snap-back behavior requires IO elements to know their own home positions
            // note that these positions will be with reference to the parent, not the world.
            glObject.setHomePosition();

            // Outputs, when dragged, should draw "stretchy" lines from  their "home" positions to the drag position.
            // When dropped on an acceptable input, this line will be drawn as a permanent "connection" instead
            var stretchy = that.drawCurveFromPointToPoint(glObject.getHomePosition(), glObject.position);
            glObject.parent.add(stretchy);
            glObject.addEventListener('changePosition',function(e){
                that.drawCurveFromPointToPoint(glObject.getHomePosition(), glObject.position, stretchy);
                // TODO: When there's a connection to this node, the INTERNAL line SHOULD NOT be redrawn when the overall component is moved!!
                // OBSERVE WHEN THIS IS CALLED
                console.log('redraw');
            });
        });


        return ioElement;
    };

    // We need the css renderer so that standard DOM components like inputs can be usable, and scaled
    // all the hit calculation and drawing of connections, however, happens in webgl.
    Workspace.prototype.createGLElementToMatch = function(cssElement){
        var width = cssElement.element.clientWidth, height = cssElement.element.clientHeight;

        // it's possible to hit this line before the css element renders.
        if (width === 0 || height === 0) { throw new Error("CSS Element Must be allowed to render before polling for its size."); }

        var rectShape = new THREE.Shape();
        rectShape.moveTo( 0, 0 );
        rectShape.lineTo( 0, height );
        rectShape.lineTo( width, height );
        rectShape.lineTo( width, 0 );
        rectShape.lineTo( 0, 0 );

        var geometry = new THREE.ShapeGeometry( rectShape );
        geometry.applyMatrix( new THREE.Matrix4().makeTranslation( - width/2,  - height/2, 0) ); // the corresponding css element centers itself on the 3js position
        var mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true, transparent: true, opacity: 0.0 }) );
        mesh.position.set(cssElement.position.x,cssElement.position.y,0);
        cssElement.element.uuid = cssElement.uuid;

        // enable easy lookups in all directions:
        this.objectDictionary[mesh.uuid] = mesh;
        this.objectDictionary[cssElement.uuid] = cssElement;
        this.cssObjectsByGLId[mesh.uuid] = cssElement;
        this.glObjectsByCSSId[cssElement.uuid] = mesh;

        // Add to scene if this is a top-level element, otherwise mimick the css-object hierarchy to keep pieces moving together!
        // TODO: Find a better test for "is a THREE.CSS3DObject"
        if (!_.isUndefined(cssElement.parent.element)) {
            // look up the right GL parent:
            this.glObjectsByCSSId[cssElement.parent.uuid].add(mesh);
        } else {
            this.glscene.add(mesh);
        }

        return mesh;
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

        // listen for click events, which could be drag-starts
        this.renderer.domElement.addEventListener("mousedown",this.mouseDown);
    };

    Workspace.prototype.enableControls = function(value){
        this.controls.enabled = value;
    };








    /* Drag and drop */

    Workspace.prototype.mouseDown = function(event){
        if ( this.controls.enabled === false ) return;

        if ( event.button === 0) {
            event.preventDefault();

            if (this.startDrag(event) === true) {
                console.warn('wait 150ms before initializing drag-pickup stuff? You should be able to click on elements normally');
                this.renderer.domElement.addEventListener("mousemove",this.drag);
                this.renderer.domElement.addEventListener("mouseup",this.mouseUp);
            }
        }
    };

    Workspace.prototype.mouseUp = function(event){
        if (!_.isNull(this.dragObject)) {
            // io's, return home
            var home = this.glDragObject.getHomePosition();
            if (!_.isUndefined(home)) {
                this.dragObject.position.set(home.x,home.y,0);
                this.glDragObject.position.set(home.x,home.y,0);
                this.glDragObject.updateMatrixWorld(); // so that wires are drawn to the new position, not the old one, even in the same render frame
                this.glDragObject.dispatchEvent({ type: 'changePosition' });  // redraw wires
                this.render(); // so that if no wires are connected, the element still visually returns home
            }

            this.dragObject = null;
            this.glDragObject = null;
            this.dragOffset = {};
            this.renderer.domElement.removeEventListener("mousemove",this.drag);
            this.renderer.domElement.removeEventListener("mouseup",this.mouseUp);
        };

        if (!_.isNull(this.hoverObject)) {
            console.log('drop! ',this.hoverObject);
            this.clearHover();
        }
    };

    Workspace.prototype.startDrag = function(e){
        var nodeToDrag = null;
        if (e.target.className.indexOf('draggable') !== -1) {nodeToDrag = e.target;}
        if (_.isNull(nodeToDrag) && e.target.parentNode.className.indexOf('draggable') !== -1) {nodeToDrag = e.target.parentNode;}

        if (!_.isNull(nodeToDrag)) {
            var unprojectedVector = this.unprojectMouse(e.clientX, e.clientY),
            mousePosition = this.mouseWorldXYPosition(unprojectedVector);

            // the three.js object id is passed back by the start drag event.
            this.dragObject = this.objectDictionary[nodeToDrag.uuid];
            this.glDragObject = this.glObjectsByCSSId[nodeToDrag.uuid];
            this.hoverObject = null;
            this.glHoverObject = null;

            // the "offset" here refers to the x,y offset between the mouse pointer in currently-zoomed world coordinates
            // and the center of the dragging object
            this.dragOffset = {x: mousePosition.x - this.dragObject.position.x, y: mousePosition.y - this.dragObject.position.y};

            // store the list of intersection objects once to avoid doing it on every move event. Don't intersect with the object you're dragging.
            this.intersectionObjects = this.computeDroppableObjects();

            return true;
        }
        return false; // nothing to pick up -- no drag started
    };

    Workspace.prototype.computeDroppableObjects = function(){
        var droppables = [];
        var draggableScopes = this.dragObject.getDraggableScopes();

        var that = this;

        // a little messy recursion here to make sure we intersect with GL Objects' children
        function testAndAdd(glObject){
            if (glObject !== that.glDragObject && glObject !== that.glscene && !_.isUndefined(that.cssObjectsByGLId[glObject.uuid])) { // draggable never droppable on itself
                if (that.cssObjectsByGLId[glObject.uuid].isDroppableForScopes(draggableScopes)){
                    droppables.push(glObject);
                }
            }
            _.each(glObject.children,testAndAdd);
        }
        testAndAdd(that.glscene);

        return droppables;
    };

    Workspace.prototype.drag = function(e){
        var unprojectedVector = this.unprojectMouse(e.clientX, e.clientY);
        var worldPosition = this.mouseWorldXYPosition(unprojectedVector);
        this.dragObject.position.set(worldPosition.x - this.dragOffset.x, worldPosition.y - this.dragOffset.y, 0);
        this.glDragObject.position.set(worldPosition.x - this.dragOffset.x, worldPosition.y - this.dragOffset.y, 0);
        this.glDragObject.dispatchEvent({ type: 'changePosition' });
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
//            console.log(intersects);
            this.glHoverObject = intersection.object;
            this.hoverObject = this.cssObjectsByGLId[intersection.object.uuid];
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

    return new Workspace();
});
