require(["appconfig"],function(){
    require([
            'SISL/sisl_loader',
            'dataFlow/dataFlow_loader',
            "viewer/init",
            "dataFlow/UI/workspaceView",
            "windowControls"
        ],
        function(
            Geo,
            dataFlow,
            viewer,
            workspace,
            windowControls
        ){
            // Set up DOM, threejs, camera controls, etc. Then hit go!
//            viewer.createScene();

            // THREEJS includes a number of useless curve geometries. Ultimately, they just provide
            // duplicate but inferior functionality to SISL's, and to plot them you have to pull points manually anyways.

            var showTestCurve = function() {
                // Mirrors the curve specified in example01.cpp. NOT the same as the example images on SINTEF website!
                var p0 = new Geo.Point(0, 0, 0),
                    p1 = new Geo.Point(1, 0, 0.5),
                    p2 = new Geo.Point(1, 1, 1),
                    p3 = new Geo.Point(0, 1, 1.5),
                    p4 = new Geo.Point(0, 0, 2),
                    p5 = new Geo.Point(1, 0, 2.5),
                    p6 = new Geo.Point(1, 1, 3),
                    p7 = new Geo.Point(0, 1, 3.5),
                    p8 = new Geo.Point(0, 0, 4),
                    p9 = new Geo.Point(1, 0, 4.5),

                // Create the SISL Curve:
                    curve = new Geo.Curve([p0, p1, p2, p3, p4, p5, p6, p7, p8, p9], 3, false);

                // For illustration -- show the control polygon
                var ctrlpts = [p0, p1, p2, p3, p4, p5, p6, p7, p8, p9];

                var material = new THREE.LineBasicMaterial({
                    color: 0xff00f0,
                });

                var geometry = new THREE.Geometry();

                // Curves parameterized 0 --> 1.
                // Step through parameters to get points, draw connecting lines
                // SHOULD INCLUDE SOMETHING ABOUT PRECISION!
                for (var i = 0; i < 1; i += 0.01) {
                    var pt = curve.getPositionAt(i).getCoordsArray();
                    geometry.vertices.push(new THREE.Vector3(pt[0], pt[1], pt[2]));
                }

                var line = new THREE.Line(geometry, material);
                viewer.scene.add(line);

                var endPointGeo = new THREE.Geometry();

                // construct geometry for control polygon
                for (var a = 0; a < ctrlpts.length; a++) {
                    var pt = ctrlpts[a].getCoordsArray();
                    endPointGeo.vertices.push(new THREE.Vector3(pt[0], pt[1], pt[2]));
                }

                var mat2 = new THREE.LineBasicMaterial({
                    color: 0x00fff0,
                });
                var line2 = new THREE.Line(endPointGeo, mat2);
                viewer.scene.add(line2);
                viewer.render();
            }

            // Test object
            showTestCurve();

            // The control workspace needs to be initialized, too:
//            workspace.enableControls(false);
//            viewer.enableControls(true);
        }
    );
});
