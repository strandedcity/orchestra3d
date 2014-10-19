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
    function Workspace(){
        this.dragObject = null;
        this.init();
    };

    Workspace.prototype.init = function(){
        console.log('Creating workspace!!');

        // drag and drop related
        _.bindAll(this, "startDrag", "drag", "render", "createGLElementToMatch", "mouseDown", "mouseUp");
        this.dragObject = null;
        this.dragOffset = [0,0];

        var width = window.innerWidth / 2,
            height = window.innerHeight;
        this.camera = new THREE.PerspectiveCamera( 70, width / height, 1, 5000 );
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

        // for testing!
        this.testElement();

        this.attachControls();
    };

    Workspace.prototype.testElement = function(){

        var pointxyz = this.createElementWithNamePosition("Point (x,y,z)", 0, 0);
        this.scene.add( pointxyz );

        var number1 = this.createElementWithNamePosition("Number",-300,-200);
        this.scene.add(number1);
        var number2 = this.createElementWithNamePosition("Number",-350,-50);
        this.scene.add(number2);
        var number3 = this.createElementWithNamePosition("Number",-400,300);
        this.scene.add(number3);

        var that = this;
        _.defer(function(){
            that.createGLElementToMatch(number1);
            that.createGLElementToMatch(number2);
            that.createGLElementToMatch(number3);
            that.createGLElementToMatch(pointxyz);

            that.render();
        });

    };

    Workspace.prototype.createElementWithNamePosition = function(name, x, y){
        var element = document.createElement( 'div' );
        element.className = 'draggable element';

        var number = document.createElement( 'input' );
        number.type = "text";
        number.className = 'number';
        number.value = name;
        element.appendChild( number );

        var object = new THREE.CSS3DObject( element );
        object.position.x = x || 0;
        object.position.y = y || 0;
        object.position.z = 0;
        element.id = object.id; // so the object is identifiable later for drag/drop operations
        return object;
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
        var mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true, transparent: true }) );
        mesh.position.set(cssElement.position.x,cssElement.position.y,0);
        cssElement.element.glid = mesh.id; // keep a reference to the mesh "tracker" in the GL Scene
        this.glscene.add(mesh);
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
        console.warn('wait 150ms before initializing drag-pickup stuff? You should be able to click on elements normally');

        if ( this.controls.enabled === false ) return;

        if ( event.button === 0) {
            event.preventDefault();

            if (this.startDrag(event) === true) {
                this.renderer.domElement.addEventListener("mousemove",this.drag);
                this.renderer.domElement.addEventListener("mouseup",this.mouseUp);
            }
        }
    };

    Workspace.prototype.mouseUp = function(event){
        if (!_.isNull(this.dragObject)) {
            this.dragObject = null;
            this.glDragObject = null;
            this.dragOffset = {};
            this.renderer.domElement.removeEventListener("mousemove",this.drag);
            this.renderer.domElement.removeEventListener("mouseup",this.mouseUp);
        };
    };

    Workspace.prototype.startDrag = function(e){
        var appliedClasses = e.target.parentNode.className;
        if (appliedClasses.indexOf('draggable') !== -1) {
            var unprojectedVector = this.unprojectMouse(e.clientX, e.clientY),
            mousePosition = this.mouseWorldXYPosition(unprojectedVector);

            // the three.js object id is passed back by the start drag event.
            var draggingId = parseInt(e.target.parentNode.id);
            this.dragObject = this.scene.getObjectById(draggingId);
            this.glDragObject = this.glscene.getObjectById(this.dragObject.element.glid);

            // the "offset" here refers to the x,y offset between the mouse pointer in currently-zoomed world coordinates
            // and the center of the dragging object
            this.dragOffset = {x: mousePosition.x - this.dragObject.position.x, y: mousePosition.y - this.dragObject.position.y};

            return true;
        }
        return false; // nothing to pick up -- no drag started
    };

    Workspace.prototype.drag = function(e){
        var unprojectedVector = this.unprojectMouse(e.clientX, e.clientY);
        var worldPosition = this.mouseWorldXYPosition(unprojectedVector);
        this.dragObject.position.set(worldPosition.x - this.dragOffset.x, worldPosition.y - this.dragOffset.y, 0);
        this.glDragObject.position.set(worldPosition.x - this.dragOffset.x, worldPosition.y - this.dragOffset.y, 0);
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

        var objects = [];
        _.each(this.glscene.children,function(el){
            objects.push(el);
        });

        // create an array containing all objects in the scene with which the ray intersects
        var intersects = ray.intersectObjects( objects, true );

        console.log(intersects);
    };

    return new Workspace();
});
