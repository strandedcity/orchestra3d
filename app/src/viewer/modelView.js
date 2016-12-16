define(["threejs","OrbitControls"],function(){
    function ModelSpace(){
        this.width = window.innerWidth/2;
        this.height = window.innerHeight;

        // This module loads three.js, then provides a function to perform the basic setup of a scene. It returns three.js variables needed to access that scene.
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.width/this.height, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialiasing: true });
        //this.createScene(); // the app must do this, to avoid rendering a blank window during tests.

        _.bindAll(this,"render","clearScene","toJSON","fromJSON");
    }

    ModelSpace.prototype.createScene = function(){
        this.renderer.setSize(this.width, this.height);
        document.body.appendChild(this.renderer.domElement);

        console.warn("temporary setting of viewer position for testing");
        this.renderer.domElement.style.left = this.width;

        this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );

        this.controls.addEventListener( 'change', this.render);

        this.camera.position.set(6,8,6);
        this.camera.up = new THREE.Vector3(0,1,0);
        this.camera.lookAt(new THREE.Vector3(0,0,0));

        this.setupScene();
    };


    ModelSpace.prototype.toJSON = function(){
        // This method is in charge of storing any customized properties of the scene presentation, so it
        // can be restored.
        var c = this.camera;
        window.camera = this.camera;
        return {
            camera: {
                position: c.position.toArray(),
                rotation: c.rotation.toArray()
            },
            controls: {
                target: this.controls.target.toArray()
            }
        };
    };

    ModelSpace.prototype.fromJSON = function(json){
        if (!json) return;

        // Restore a model viewer from persisted data
        if (json.camera) {
            var expectedKeys = ['position','rotation','scale'],
                c = this.camera;
            _.each(expectedKeys,function(key){
                if (json.camera[key]) {c[key].fromArray(json.camera[key])}
            });
            c.updateMatrixWorld(true);
        }
        if (json.controls && json.controls.target) {
            this.controls.target.fromArray(json.controls.target);
            this.controls.target0.fromArray(json.controls.target);
            this.controls.update();
        }

        this.render();
    };

    ModelSpace.prototype.setupScene = function(){
        //var axisHelper = new THREE.AxisHelper( 2 );
        //this.scene.add( axisHelper );

        var gridHelper = new THREE.GridHelper( 30, 60, 0x444444, 0x888888 );
        this.scene.add(gridHelper);
        this.renderer.setClearColor( 0xaaaaaa, 1 );
    };

    ModelSpace.prototype.clearScene = function(){
        var child;

        // scene.children is mutated as each child is removed, so it's actually possible to "loop" over the first item:
        while (child = this.scene.children[0]){
            this.scene.remove(child);
        }

        this.setupScene();
        this.render();
    };

    ModelSpace.prototype.render = function(){
        // DO NOT USE REQUESTANIMATIONFRAME WITHOUT CHECKING THIS SCENARIO:
        // 1: USE ATTRACTOR GRID EXAMPLE
        // 2: VERIFY SLIDER IS WORKING
        // 3: EXPAND GRID FROM 20X20 TO 30X30
        // 4: MAKE SURE THE GRID PREVIEW IS EXPANDED

        this.renderer.render( this.scene,  this.camera);
    };

    return new ModelSpace();
});