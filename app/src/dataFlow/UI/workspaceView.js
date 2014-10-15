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
        _.bindAll(this, "startDrag", "drag", "render");
        this.dragObject = null;
        this.dragOffset = [0,0];

        var width = window.innerWidth / 2,
            height = window.innerHeight;
        this.camera = new THREE.PerspectiveCamera( 70, width / height, 1, 5000 );
        this.camera.position.z = 800;

        this.scene = new THREE.Scene();

        this.renderer = new THREE.CSS3DRenderer();
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

    Workspace.prototype.render = function(){
        this.renderer.render(this.scene,this.camera);
    };

    Workspace.prototype.attachControls = function(){
        this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
        this.controls.noRotate = true;
        this.controls.zoomSpeed = 2.0;
        this.controls.addEventListener( 'change', this.render );
        this.controls.addEventListener( 'drag', this.drag );
        this.controls.addEventListener( 'dragStart', this.startDrag);
        this.render();
    };

    Workspace.prototype.startDrag = function(e){
        // the three.js object id is passed back by the start drag event.
        var draggingId = parseInt(e.detail.target);
        this.dragObject = this.scene.getObjectById(draggingId);

        // the "offset" here refers to the x,y offset between the mouse pointer in currently-zoomed world coordinates
        // and the center of the dragging object
        this.dragOffset = {x: e.detail.startPosition.x - this.dragObject.position.x, y: e.detail.startPosition.y - this.dragObject.position.y};
    };

    Workspace.prototype.drag = function(e){
        this.dragObject.position.set(e.detail.x - this.dragOffset.x, e.detail.y - this.dragOffset.y, 0);
        this.render();
    };

    Workspace.prototype.enableControls = function(value){
        this.controls.enabled = value;
    };

    return new Workspace();
});
