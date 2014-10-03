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
    var instance = undefined;

    function Workspace(){
        this.init();
    };

    Workspace.prototype.init = function(){
        console.log('Creating workspace!!');
        this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 5000 );
        this.camera.position.z = 300;

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
        var element = document.createElement( 'div' );
        element.className = 'element';
        element.style.backgroundColor = 'red';

        var number = document.createElement( 'input' );
        number.type = "text";
        number.className = 'number';
        number.textContent = "1";
        element.appendChild( number );

        var object = new THREE.CSS3DObject( element );
        object.position.x = 0;
        object.position.y = 0;
        object.position.z = 0;
        this.scene.add( object );
    };

    Workspace.prototype.attachControls = function(){
        var that = this;
        var render = function(){
            that.renderer.render(that.scene,that.camera);
        };
        this.controls = new THREE.OrbitControls( this.camera );
        this.controls.noRotate = true;
        this.controls.zoomSpeed = 2.0;
        this.controls.addEventListener( 'change', render );
        render();
    };

    Workspace.prototype.enableControls = function(value){
        this.controls.enabled = value;
    };

    instance = new Workspace();

    return instance;
});
