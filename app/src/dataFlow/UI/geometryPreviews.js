define([
    "viewer/modelView",
    "underscore"
],function(viewer, _){
    var SETTINGS = {
        CURVE_SECTIONS: 20
    };

    var Preview = {};

    var CurvePreview = Preview.CurvePreview = function CurvePreview(curve){
        this.initialize.call(this,curve);
    };

    CurvePreview.prototype.initialize = function(curve){
        if (_.isNull(curve)) return;
        if (_.isEmpty(curve) || _.isUndefined(curve._pointer) || curve._pointer === 0) {
            throw new Error("CurvePreview requires GeoCurve objects to be passed in at initialize time");
        }

        _.bindAll(this, "remove");

        this.curve = curve;

        this.material = new THREE.LineBasicMaterial({
            color: 0xff00f0
        });

        this.line = this.draw(this.line);
        viewer.render();
    };
    CurvePreview.prototype.draw = function(line){
        var minParameter =  this.curve.getMinParameter();
        var maxParameter =  this.curve.getMaxParameter();
        var paramWidth = maxParameter - minParameter;

        var geom = _.isUndefined(line) ? new THREE.Geometry() : line.geometry;

        // Curves parameterized 0 --> 1.
        // Step through parameters to get points, draw connecting lines
        // SHOULD INCLUDE SOMETHING ABOUT PRECISION!
        for (var i = 0; i <= SETTINGS.CURVE_SECTIONS; i += 1) {
            var evalAt = i*paramWidth/SETTINGS.CURVE_SECTIONS + minParameter;
            var pt = this.curve.getPositionAt(evalAt).toArray();
            geom.vertices[i] = new THREE.Vector3(pt[0], pt[1], pt[2]);
        }

        geom.verticesNeedUpdate = true;

        var currentLine = line || new THREE.Line(geom, this.material);

        if (_.isUndefined(line)) {
            viewer.scene.add(currentLine);
        }

        return currentLine;
    };
    CurvePreview.prototype.remove = function(){
        if (!_.isUndefined(this.line)) {
            viewer.scene.remove(this.line);
            this.line.remove();
            delete this.line;
            viewer.render();
        }
    };

    // The "point" preview function actually previews a list of points so that it can work with ThreeJS Geometries More effectively.
    // By doing lists of points at a time, we can just initialize a single geometry to hold all the points instead of a separate one for each
    var PointListPreview = Preview.PointListPreview = function PointListPreview(points) {
        this.initialize.call(this,points);
    };

    PointListPreview.prototype.initialize = function(points){
        var particleGeometry = new THREE.Geometry();

        _.each(points,function(pt){
            var arr = pt.toArray();
            var particle = new THREE.Vector3(arr[0], arr[1], arr[2]);
            particleGeometry.vertices.push(particle);  // repeat for every point
        });

        var pointSprite = THREE.ImageUtils.loadTexture( "/SISL/app/img/pointSprite.png" );

        //var material = new THREE.PointCloudMaterial( { map: pointSprite, blending: THREE.AdditiveBlending, depthTest: false } );
        var material = new THREE.PointCloudMaterial( { size: 0.5, map: pointSprite, blending: THREE.AdditiveBlending, depthTest: false, transparent : true } );
        this.system = new THREE.PointCloud(
            particleGeometry,
            material
        );

        viewer.scene.add(this.system);

        _.defer(function(){
            viewer.render();
        });
        viewer.render();
    };
    PointListPreview.prototype.remove = function(){
        if (!_.isUndefined(this.system)) {
            viewer.scene.remove(this.system);
            this.system.remove();
            delete this.system;
            viewer.render();
        }
    };

    var VectorPreview = Preview.VectorPreview = function VectorPreview(anchor, vector){
        this.initialize.call(this,anchor,vector);
    };

    VectorPreview.prototype.initialize = function(anchor,vector){
        // TODO: Length and color should be abstracted as user preferences.
        var color = 0xffff00;
        if (_.isNull(anchor) || _.isNull(vector)) return;
        var dir = vector.clone().normalize(),  // MUST be a unit vector!
            len = vector.length();

        if (len === 0) return; // don't add vectors with zero length. that messes with shit.
        this.arrowHelper = new THREE.ArrowHelper( dir, anchor, len, color );
        viewer.scene.add( this.arrowHelper );

        _.defer(function(){
            viewer.render();
        });
    };
    VectorPreview.prototype.remove = function(){
        if (!_.isUndefined(this.arrowHelper)) {
            viewer.scene.remove(this.arrowHelper);
            this.arrowHelper.remove();
            delete this.arrowHelper;
            viewer.render();
        }
    };

    return Preview;
});