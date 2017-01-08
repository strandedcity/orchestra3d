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
        console.warn("TODO: USE BUFFER GEOMETRY FOR DYNAMIC LINE DRAWING. SEE http://stackoverflow.com/questions/31399856/drawing-a-line-with-three-js-dynamically/31411794#31411794");

        if (_.isEmpty(curveList)) return;
        if (!_.isArray(curveList)) throw new Error("CurveListPreview requires an array of GeoCurve Objects to render");

        this.curveList = curveList;

        _.bindAll(this, "remove","updateGeometry");

        this.material = new THREE.LineBasicMaterial({
            color: 0xff00f0
        });

        this.line = new THREE.LineSegments(this.draw(),this.material);
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
    CurveListPreview.prototype.updateGeometry = function(curveList){
        this.curveList = curveList;
        this.remove();
        this.line = new THREE.LineSegments(this.draw(),this.material);
        // this.line.geometry = this.draw(this.line);
        viewer.render();
        return this.line;
    };
    CurveListPreview.prototype.draw = function(line){
        var newVertices = [],
            segmentCounter=0;
            
        _.each(this.curveList,function(curve){
            if (_.isEmpty(curve) || _.isUndefined(curve._pointer) || curve._pointer === 0) {
                // skip!
            } else {
                var minParameter =  curve.getMinParameter(),
                    maxParameter =  curve.getMaxParameter(),
                    paramWidth = maxParameter - minParameter,
                    prevPointInCurve = (new THREE.Vector3()).fromArray(curve.getPositionAt(minParameter).toArray());

                //degree = this.getCurveOrder()-1;
                if (curve.getCurveOrder()-1 === 1) {
                    // straight lines. Use the control points directly.
                    var controlPoints = curve.getControlPoints();
                    for (var i=1; i<controlPoints.length; i++){
                        newVertices.push(controlPoints[i-1]);
                        newVertices.push(controlPoints[i]);
                    }
                } else {
                    // Step through curve parameters
                    segmentCounter = 0;
                    while (segmentCounter <= SETTINGS.CURVE_SECTIONS) {
                        var evalAt = segmentCounter*paramWidth/SETTINGS.CURVE_SECTIONS + minParameter;
                        var pt = curve.getPositionAt(evalAt).toArray();
                        var newpt = new THREE.Vector3(pt[0], pt[1], pt[2]);

                        // adding two points at a time enables us to keep multiple curves in a list defined inside a single THREE.Geometry
                        // without connecting each of the lines. See THREE.LineSegments below. This is a huge performance gain over
                        // adding one point at a time, assuming the lines can't be connected.
                        newVertices[newVertices.length] = prevPointInCurve;
                        newVertices[newVertices.length] = newpt;
                        prevPointInCurve = newpt;
                        segmentCounter++;
                    }
                }

            }
        });

        // The vertex buffers managed by THREE.Geometry allow you to MODIFY vertex positions,
        // but the size of that vertex buffer can't be changed. Changing it is expensive,
        // similar to creating new geometry from scratch. So the strategy here will be to do just
        // that. If the buffer shrinks from last time, "extra" vertices will be zeroed out / hidden.
        // If the buffer grows, we'll scrap the geometry and make a new, larger one.
        // See discussion:  https://github.com/mrdoob/three.js/issues/342

        // Update! THREEJS has a built in means for doing this with BufferGeometry. See .setDrawRange()
        // http://stackoverflow.com/questions/31399856/drawing-a-line-with-three-js-dynamically
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

        var loader = new THREE.TextureLoader(),
            pointTexture = loader.load("./img/pointSprite_selected.png");

        //var material = new THREE.PointCloudMaterial( { map: pointSprite, blending: THREE.AdditiveBlending, depthTest: false } );
        var material = new THREE.PointsMaterial( {sizeAttenuation: false, size: 16, transparent:true, blending: THREE.AdditiveBlending, depthTest: false,  map: pointTexture } );
        this.system = new THREE.Points(
            particleGeometry,
            material
        );

        viewer.scene.add(this.system);
        _.delay(function(){
            viewer.render();
        },100);
    };
    PointListPreview.prototype.updateGeometry = function(points){
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