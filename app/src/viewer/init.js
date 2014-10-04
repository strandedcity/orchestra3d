define(["threejs","OrbitControls"],function(){
    function ModelSpace(){
        // This module loads three.js, then provides a function to perform the basic setup of a scene. It returns three.js variables needed to access that scene.
        this.scene = new THREE.Scene(),
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000),
        this.renderer = new THREE.WebGLRenderer(),
        this.animating = true;
        this.createScene();
    }

    ModelSpace.prototype.createScene = function(){
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls( this.camera );
//THIS APPROACH IS MUCH BETTER --- NO REASON TO ANIMATE IF NOTHING IS MOVING
        var that = this;
        this.controls.addEventListener( 'change', function(){
            that.render.call(that);
        } );

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