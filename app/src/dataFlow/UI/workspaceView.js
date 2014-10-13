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
    "OrbitControls"
],function(){
    function Workspace(){
        this.init();
    };

    Workspace.prototype.init = function(){
        console.log('Creating workspace!!');
        this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 5000 );
        this.camera.position.z = 800;

        this.scene = new THREE.Scene();

        this.renderer = new THREE.CSS3DRenderer();
        this.renderer.setSize( window.innerWidth/2, window.innerHeight );
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

//        console.log(pointxyz);
//        $(pointxyz.element).draggable({
//            start: function () {
//                /* Temporarily revert the transform so drag and dropping works as expected */
////                var parentRect = $(this).parent()[0].getBoundingClientRect();
//                var rect = this.getBoundingClientRect();
//                console.log(rect);
//                /* cssBrowserPrefix is one of: -moz -webkit -o */
////                $(this).css(cssBrowserPrefix + 'transition', 'all 0 ease 0');
////                $(this).css('transform', 'none');
////                $(this).css('left', rect['left'] - parentRect['left']);
//            },
//            stop: function () {
//                /* Revert the transformation changes done on start, if needed */
//            }
//        });

        // from http://mdqinc.com/blog/2013/01/css3-transforms-vs-jquery-draggable/
//        var dragging = false;
//        pointxyz.element.addEventListener('mousedown',function(){
//            document.addEventListener('mousemove',function(e){console.log(e.clientX, e.clientY);});
//        });











        // NEXT APPROACH!
        // Get the delta of the drag DIRECTLY from inside orbit controls
        // Move the threeJS object accordingly if there's an intersection on mousedown.

        // find startpoint raycasted intersection with xy plane

        // on mousemove, find raycasted intersection with xy plane

        // report drag event location




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

        return object;
    };

    Workspace.prototype.attachControls = function(){
        var that = this;
        var render = function(){
            that.renderer.render(that.scene,that.camera);
        };
        this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
        this.controls.noRotate = true;
        this.controls.zoomSpeed = 2.0;
        this.controls.addEventListener( 'change', render );
        render();
    };

    Workspace.prototype.enableControls = function(value){
        this.controls.enabled = value;
    };

    return new Workspace();
});
