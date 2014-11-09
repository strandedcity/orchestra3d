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

        _.bindAll(this, "remove");

        this.curve = curve;

        this.material = new THREE.LineBasicMaterial({
            color: 0xff00f0
        });

        this.line = this.draw(this.line);
    };
    CurvePreview.prototype.draw = function(line){


        var geom = _.isUndefined(line) ? new THREE.Geometry() : line.geometry;

        // Curves parameterized 0 --> 1.
        // Step through parameters to get points, draw connecting lines
        // SHOULD INCLUDE SOMETHING ABOUT PRECISION!
        for (var i = 0; i < 100; i += 1) {
            var pt = this.curve.getPositionAt(i/100).getCoordsArray();
            geom.vertices[i] = new THREE.Vector3(pt[0], pt[1], pt[2]);
        }

        geom.verticesNeedUpdate = true;

        var currentLine = line || new THREE.Line(geom, this.material);

        if (_.isUndefined(line)) {
            viewer.scene.add(currentLine);
        }

        viewer.render();
        return currentLine;
    };
    CurvePreview.prototype.remove = function(){
        if (!_.isUndefined(this.line)) {
            //console.log('removing ',this.line);
            viewer.scene.remove(this.line);
            this.line.remove();
            delete this.line;
        }
    };

    return Preview;
});