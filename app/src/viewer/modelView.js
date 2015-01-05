define(["threejs","OrbitControls"],function(){
    function ModelSpace(){
        this.width = window.innerWidth/2;
        this.height = window.innerHeight;

        // This module loads three.js, then provides a function to perform the basic setup of a scene. It returns three.js variables needed to access that scene.
        this.scene = new THREE.Scene(),
        this.camera = new THREE.PerspectiveCamera(75, this.width/this.height, 0.1, 1000),
        this.renderer = new THREE.WebGLRenderer(),
        this.animating = true;
        //this.createScene(); // the app must do this, to avoid rendering a blank window during tests.

        _.bindAll(this,"render");
    }

    ModelSpace.prototype.createScene = function(){
        this.renderer.setSize(this.width, this.height);
        document.body.appendChild(this.renderer.domElement);

        console.warn("temporary setting of viewer position for testing");
        this.renderer.domElement.style.left = this.width;

        this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );

        this.controls.addEventListener( 'change', this.render);

        this.camera.position.z = 7;
        this.camera.position.y = 0;

        this.animating = true;
    };

    ModelSpace.prototype.render = function(){
        if ( this.animating === false) return;
//        var that = this;
//        requestAnimationFrame(that.render);

        this.renderer.render( this.scene,  this.camera);
    };

    ModelSpace.prototype.setAnimating = function(val){
        this.animating = val;
        if ( this.animating === true)  this.render();
    };

    ModelSpace.prototype.enableControls = function(value){
        this.controls.enabled = value;
    }

    return new ModelSpace();
});