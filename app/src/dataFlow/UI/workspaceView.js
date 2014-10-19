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
        this.init();
    };

    Workspace.prototype.init = function(){
        console.log('Creating workspace!!');

        // drag and drop related
        _.bindAll(this, "startDrag", "drag", "render", "createGLElementToMatch", "mouseMove");
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
        this.renderer.domElement.addEventListener("mousemove",this.mouseMove);

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
        this.controls.addEventListener( 'dragStart', this.startDrag);
        this.controls.addEventListener( 'drag', this.drag );
        this.render();
    };

    Workspace.prototype.startDrag = function(e){
        // the three.js object id is passed back by the start drag event.
        var draggingId = parseInt(e.detail.target);
        this.dragObject = this.scene.getObjectById(draggingId);
        this.glDragObject = this.glscene.getObjectById(this.dragObject.element.glid);

        // the "offset" here refers to the x,y offset between the mouse pointer in currently-zoomed world coordinates
        // and the center of the dragging object
        this.dragOffset = {x: e.detail.startPosition.x - this.dragObject.position.x, y: e.detail.startPosition.y - this.dragObject.position.y};
    };

    Workspace.prototype.drag = function(e){
        this.dragObject.position.set(e.detail.x - this.dragOffset.x, e.detail.y - this.dragOffset.y, 0);
        this.glDragObject.position.set(e.detail.x - this.dragOffset.x, e.detail.y - this.dragOffset.y, 0);
        this.findIntersections(e.detail.x, e.detail.y);
        this.render();
    };

    Workspace.prototype.enableControls = function(value){
        this.controls.enabled = value;
    };

    Workspace.prototype.mouseMove = function(e){
        this.findIntersections(e.clientX, e.clientY);
    };

    Workspace.prototype.findIntersections = function(x,y){
        // find intersections

        // create a Ray with origin at the mouse position
        //   and direction into the scene (camera direction)
        var projector = new THREE.Projector();
        var vector = new THREE.Vector3( x, y, 1 );

        var vector = new THREE.Vector3(
                ( x / this.glrenderer.domElement.clientWidth ) * 2 - 1,
                - ( y / this.glrenderer.domElement.clientHeight ) * 2 + 1,
            0.5 );

        projector.unprojectVector( vector, this.camera );
        var ray = new THREE.Raycaster( this.camera.position, vector.sub( this.camera.position ).normalize() );

        var objects = [];
        _.each(this.glscene.children,function(el){
            objects.push(el);
        });

        // create an array containing all objects in the scene with which the ray intersects
        var intersects = ray.intersectObjects( objects, true );
console.log( x, y, intersects);
//        console.log(intersects);
        // INTERSECTED = the object in the scene currently closest to the camera
        //		and intersected by the Ray projected from the mouse position
//var INTERSECTED = null;
//        // if there is one (or more) intersections
//        if ( intersects.length > 0 )
//        {
//            // if the closest object intersected is not the currently stored intersection object
//            if ( intersects[ 0 ].object != INTERSECTED )
//            {
//                // restore previous intersection object (if it exists) to its original color
//                if ( INTERSECTED )
//                    INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
//                // store reference to closest object as current intersection object
//                INTERSECTED = intersects[ 0 ].object;
//                console.log(INTERSECTED);
//                // store color of closest object (for later restoration)
//                INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
//                // set a new color for closest object
//                INTERSECTED.material.color.setHex( 0xffff00 );
//            }
//        }
//        else // there are no intersections
//        {
//            console.log('no intersections');
//            // restore previous intersection object (if it exists) to its original color
//            if ( INTERSECTED )
//                INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
//            // remove previous intersection object reference
//            //     by setting current intersection object to "nothing"
//            INTERSECTED = null;
//        }
    };

    return new Workspace();
});
