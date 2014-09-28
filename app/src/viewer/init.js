define(["threejs","OrbitControls"],function(){
    // This module loads three.js, then provides a function to perform the basic setup of a scene. It returns three.js variables needed to access that scene.
    var scene = new THREE.Scene(),
        camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000),
        renderer = new THREE.WebGLRenderer(),
        animating = true;

    var createScene = function(){
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        var controls = new THREE.OrbitControls( camera );
// THIS APPROACH IS MUCH BETTER --- NO REASON TO ANIMATE IF NOTHING IS MOVING
//        controls.addEventListener( 'change', render );

        camera.position.z = 7;
        camera.position.y = 0;

        animating = true;

        render();
    };

    var render = function () {
        if (animating === false) return;
        requestAnimationFrame(render);

        renderer.render(scene, camera);
    };

    var setAnimating = function(val){
        animating = val;
        if (animating === true) render();
    };

    return {
        createScene: createScene,
        setAnimating: setAnimating,
        scene: scene,
        camera: camera,
        renderer: renderer
    };
});