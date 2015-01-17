define([
    "viewer/modelView",
    "underscore"
],function(viewer, _){
    var SETTINGS = {
        CURVE_SECTIONS: 30
    };

    var Preview = {};

    var CurveListPreview = Preview.CurveListPreview = function CurveListPreview(curveList){
        this.initialize.call(this,curveList);
    };

    CurveListPreview.prototype.initialize = function(curveList){
        if (_.isEmpty(curveList)) return;
        if (!_.isArray(curveList)) throw new Error("CurveListPreview requires an array of GeoCurve Objects to render");

        // The preview function will now need to detect its own null objects
        //if (_.isEmpty(curveList) || _.isUndefined(curve._pointer) || curve._pointer === 0) {
        //    throw new Error("CurvePreview requires GeoCurve objects to be passed in at initialize time");
        //}

        _.bindAll(this, "remove","updateCurveList");

        this.material = new THREE.LineBasicMaterial({
            color: 0xff00f0
        });

        this.line = this.updateCurveList(curveList);
    };
    CurveListPreview.prototype.hide = function(){
        // Hide doesn't destroy the geometry for good, it just removes it from the scene so it can be reused later if needed.
        if (!_.isUndefined(this.line)) {
            viewer.scene.remove(this.line);
            viewer.render();
        }
    };
    CurveListPreview.prototype.show = function(){
        // Hide doesn't destroy the geometry for good, it just removes it from the scene so it can be reused later if needed.
        if (!_.isUndefined(this.line)) {
            viewer.scene.add(this.line);
            viewer.render();
        }
    };
    CurveListPreview.prototype.remove = function(){
        if (!_.isUndefined(this.line)) {
            this.hide();
            delete this.line;
        }
    };
    CurveListPreview.prototype.updateCurveList = function(curveList){
        this.curveList = curveList;
        this.line = this.draw(this.line);
        viewer.render();
        return this.line;
    };
    CurveListPreview.prototype.draw = function(line){
        var geom = _.isUndefined(line) ? new THREE.Geometry() : line.geometry;

        // clear out!
        geom.vertices = [];

        _.each(this.curveList,function(curve){
            if (_.isEmpty(curve) || _.isUndefined(curve._pointer) || curve._pointer === 0) {
                // skip!
            } else {
                var minParameter =  curve.getMinParameter(),
                    maxParameter =  curve.getMaxParameter(),
                    paramWidth = maxParameter - minParameter,
                    prevPointInCurve = curve.getPositionAt(minParameter).toArray();

                // Step through curve parameters
                for (var i = 0; i <= SETTINGS.CURVE_SECTIONS; i += 1) {
                    var evalAt = i*paramWidth/SETTINGS.CURVE_SECTIONS + minParameter;
                    var pt = curve.getPositionAt(evalAt).toArray();
                    var newpt = new THREE.Vector3(pt[0], pt[1], pt[2]);

                    // adding two points at a time enables us to keep multiple curves in a list defined inside a single THREE.Geometry
                    // without connecting each of the lines. See THREE.LinePieces below. This is a huge performance gain over
                    // adding one point at a time, assuming the lines can't be connected.
                    geom.vertices[geom.vertices.length] = prevPointInCurve;
                    geom.vertices[geom.vertices.length] = newpt;
                    prevPointInCurve = newpt;
                }
            }
        });

        geom.verticesNeedUpdate = true;

        var currentLine = line || new THREE.Line(geom, this.material, THREE.LinePieces);

        if (_.isUndefined(line)) {
            viewer.scene.add(currentLine);
        }

        return currentLine;
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
            this.hide();
            delete this.system;
        }
    };
    PointListPreview.prototype.hide = function(){
        // Hide doesn't destroy the geometry for good, it just removes it from the scene so it can be reused later if needed.
        if (!_.isUndefined(this.system)) {
            viewer.scene.remove(this.system);
            viewer.render();
        }
    };
    //PointListPreview.prototype.show = function(){
    //    // Hide doesn't destroy the geometry for good, it just removes it from the scene so it can be reused later if needed.
    //    if (!_.isUndefined(this.system)) {
    //        viewer.scene.add(this.system);
    //        viewer.render();
    //    }
    //};

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
            this.hide();
            delete this.arrowHelper;
        }
    };
    VectorPreview.prototype.hide = function(){
        if (!_.isUndefined(this.arrowHelper)) {
            viewer.scene.remove(this.arrowHelper);
            viewer.render();
        }
    };
    VectorPreview.prototype.show = function(){
        // TODO !
    };

    return Preview;
});