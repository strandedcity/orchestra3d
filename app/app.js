require(["appconfig"],function(){
    require(['backbone',
            'underscore',
            'SISL/sisl_loader',
            'dataFlow/dataFlow_loader',
            "viewer/init"
        ],
        function(
            Backbone,
            _,
            Geo,
            dataFlow,
            viewer)
        {
            // Set up DOM, threejs, camera controls, etc. Then hit go!
            viewer.createScene();


            // THREEJS includes a number of totally useless curve objects. Ultimately, they just provide
            // duplicate but inferior functionality to SISL's, and to plot them you have to pull points manually anyways.

//            var spline = new THREE.SplineCurve3([
//                new THREE.Vector3(0, 0, 0),
//                new THREE.Vector3(0, 200, 0),
//                new THREE.Vector3(150, 150, 0),
//                new THREE.Vector3(150, 50, 0),
//                new THREE.Vector3(250, 100, 0),
//                new THREE.Vector3(250, 300, 0)
//            ]);

//            var start = new Geo.Point(-10,0,0),
//                mid = new Geo.Point(0,5.1,0),
//                mid2 = new Geo.Point(5.2,5.2,0),
//                end = new Geo.Point(5.2,10.1,0),
//                curve = new Geo.Curve([start,mid,mid2,end],2,false);

//            vertices = [
//                0,  0,   0,
//                1,  0, 0.5,
//                1,  1,   1,
//                0,  1, 1.5,
//                0,  0,   2,
//                1,  0, 2.5,
//                1,  1,   3,
//                0,  1, 3.5,
//                0,  0,   4,
//                1,  0, 4.5];

            // Mirrors the curve specified in example01.cpp. NOT the same as the example images on SINTEF website!
            var p0 = new Geo.Point(0,  0,   0),
                p1 = new Geo.Point(1,  0, 0.5),
                p2 = new Geo.Point(1,  1,   1),
                p3 = new Geo.Point(0,  1, 1.5),
                p4 = new Geo.Point(0,  0,   2),
                p5 = new Geo.Point(1,  0, 2.5),
                p6 = new Geo.Point(1,  1,   3),
                p7 = new Geo.Point(0,  1, 3.5),
                p8 = new Geo.Point(0,  0,   4),
                p9 = new Geo.Point(1,  0, 4.5),

                // Create the SISL Curve:
                curve = new Geo.Curve([p0,p1,p2,p3,p4,p5,p6,p7,p8,p9],3,false);

            // For illustration -- show the control polygon
            var ctrlpts = [p0,p1,p2,p3,p4,p5,p6,p7,p8,p9];

            var material = new THREE.LineBasicMaterial({
                color: 0xff00f0,
            });

            var geometry = new THREE.Geometry();

            // Step through the curve. At present, its knot vector is 0,0,0,0,1,2,3,4,5,6,7,7,7,7
            // Which means it's parameterized from 0 --> 7
            // My own knot-vector calculator is currently broken, but all curves should end up evenly parameterized from 0 --> 1 eventually
            for(var i = 0; i < 7; i+=0.05){
                var pt = curve.getPositionAt(i).getCoordsArray();
                geometry.vertices.push(new THREE.Vector3(pt[0],pt[1],pt[2]));
            }

            var line = new THREE.Line(geometry, material);
            viewer.scene.add(line);

            var endPointGeo = new THREE.Geometry();

            // construct geometry for control polygon
            for (var a=0; a< ctrlpts.length; a++){
                var pt = ctrlpts[a].getCoordsArray();
                endPointGeo.vertices.push(new THREE.Vector3(pt[0],pt[1],pt[2]));
            }

            var mat2 = new THREE.LineBasicMaterial({
                color: 0x00fff0,
            });
            var line2 = new THREE.Line(endPointGeo,mat2);
            viewer.scene.add(line2);
        }
    );
});
