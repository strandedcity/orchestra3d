define([
    "viewer/init",
    "underscore"
],function(viewer, _){
    var Preview = {};

    var CurvePreview = Preview.CurvePreview = function CurvePreview(curve){
        this.initialize.call(this,curve);
    };

    CurvePreview.prototype.initialize = function(curve){
        if (_.isUndefined(curve) || curve.constructor.name !== "GeoCurve") {
            throw new Error("CurvePreview requires GeoCurve objects to be passed in at initialize time");
        }

        this.curve = curve;

        this.material = new THREE.LineBasicMaterial({
            color: 0xff00f0
        });

        this.line = this.draw();
    };
    CurvePreview.prototype.draw = function(){
        this.geometry = this.geometry || new THREE.Geometry();

        // Curves parameterized 0 --> 1.
        // Step through parameters to get points, draw connecting lines
        // SHOULD INCLUDE SOMETHING ABOUT PRECISION!
        for (var i = 0; i < 100; i += 1) {
            var pt = this.curve.getPositionAt(i/100).getCoordsArray();
            this.geometry.vertices[i] = new THREE.Vector3(pt[0], pt[1], pt[2]);
        }

        this.geometry.verticesNeedUpdate = true;

        if (_.isUndefined(this.line)) {
            this.line = new THREE.Line(this.geometry, this.material);
            viewer.scene.add(this.line);
        }

        viewer.render();
    };

    return Preview;
});