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

        this.curveList = curveList;

        _.bindAll(this, "remove","updateCurveList");

        var material = new THREE.LineBasicMaterial({
            color: 0xff00f0
        });

        this.line = new THREE.Line(this.draw(),material,THREE.LinePieces);
        viewer.scene.add(this.line);
        viewer.render();
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
        this.line.geometry = this.draw(this.line);
        viewer.render();
        return this.line;
    };
    CurveListPreview.prototype.draw = function(line){
        var newVertices = [];

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
                    newVertices[newVertices.length] = prevPointInCurve;
                    newVertices[newVertices.length] = newpt;
                    prevPointInCurve = newpt;
                }
            }
        });

        // The vertex buffers managed by THREE.Geometry allow you to MODIFY vertex positions,
        // but the size of that vertex buffer can't be changed. Changing it is expensive,
        // similar to creating new geometry from scratch. So the strategy here will be to do just
        // that. If the buffer shrinks from last time, "extra" vertices will be zeroed out / hidden.
        // If the buffer grows, we'll scrap the geometry and make a new, larger one.
        // See discussion:  https://github.com/mrdoob/three.js/issues/342
        var geometry;
        if (_.isUndefined(line) || line.geometry.vertices.length < newVertices.length) {
            geometry = new THREE.Geometry();
            geometry.vertices = newVertices;
        } else {
            geometry = line.geometry;

            // zero out any extra vertices from the prior goround:
            while (newVertices.length < line.geometry.vertices.length) {
                newVertices.push(new THREE.Vector3(0,0,0));
            }

            geometry.vertices = newVertices;
            geometry.verticesNeedUpdate = true;
            geometry.lineDistancesNeedUpdate = true;
        }

        return geometry;
    };

    // The "point" preview function actually previews a list of points so that it can work with ThreeJS Geometries More effectively.
    // By doing lists of points at a time, we can just initialize a single geometry to hold all the points instead of a separate one for each
    var PointListPreview = Preview.PointListPreview = function PointListPreview(points) {
        this.initialize.call(this,points);
    };

    PointListPreview.prototype.initialize = function(points){
        // This is expedient, but I don't want to optimize too early. This may not be a problem
        // for simple geometry like points. (Removing the whole geometry and re-creating it)
        this.drawPoints(points);
    };
    PointListPreview.prototype.drawPoints = function(points){
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
    };
    PointListPreview.prototype.updatePoints = function(points){
        viewer.scene.remove(this.system);
        this.drawPoints(points);
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

        //_.defer(function(){
            viewer.render();
        //});
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