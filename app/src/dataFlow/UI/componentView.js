define([
    'dataFlow/dataFlow_loader',
    "dataFlow/UI/workspaceView",
    "underscore"
],function(DataFlow, workspace, _){
    var INPUT_HEIGHT = 60;

    function ComponentView(component){
        if (_.isUndefined(component) || _.isUndefined(component.recalculate) ) {
            throw new Error('ComponentView objects must be instantiated with the DataFlow.Component which they represent');
        }
        this.component = component;  // data model reference is kept here
        this.init();
    }

    ComponentView.prototype.init = function(){
        console.log("TODO: Remove object dictionaries stored on workspace if possible");
        _.bindAll(this,"createInputWithNameAndParent","wireInputToOutputFromComponent");
        this.cssObject = this.createComponentWithNamePosition(this.component.componentPrettyName, this.component.position.x, this.component.position.y);

        _.defer(function(){
            this.glObject = this.createGLElementToMatch(this.cssObject);
        }.bind(this));

        this.inputViews = {};
        this.outputViews = {};
        this.createInputs();
        this.createOutputs();

        // call once at the end!
        workspace.render();
    };

    ComponentView.prototype.createInputs = function(){
        // calculate start position for inputs:
        var inputs = this.component.inputTypes,
            inputNames = _.keys(inputs),
            that = this;
        var verticalStart = INPUT_HEIGHT * (_.keys(inputs).length - 1) / 2;

        // add each input:
        _.each(inputNames, function(ipt,idx){
            that.inputViews[ipt] = this.createInputWithNameAndParent(ipt,inputs[ipt],this.cssObject, verticalStart - idx * INPUT_HEIGHT );
        },this);
    };

    ComponentView.prototype.createOutputs = function(){
        this.createOutputWithNameAndParent(this.component.output.shortName,this.component.output.type,this.cssObject,0);
    };

    ComponentView.prototype.createComponentWithNamePosition = function(name, x, y){
        var element = document.createElement( 'div' );
        element.className = 'draggable';

        var number = document.createElement( 'input' );
        number.type = "text";
        number.className = 'number';
        number.value = name;
        element.appendChild( number );

        var cssObject = new THREE.CSS3DObject( element );
        cssObject.position.x = x || 0;
        cssObject.position.y = y || 0;
        cssObject.position.z = 0;

        workspace.scene.add(cssObject);
        element.uuid = cssObject.uuid; // so the object is identifiable later for drag/drop operations
        workspace.objectDictionary[cssObject.uuid] = cssObject;

        return cssObject;
    };


    ComponentView.prototype._createIOWithNameAndParent = function(name, parentCSSElement, verticalOffset, isInput, dragScope){
        var element = document.createElement("div");
        element.className = 'draggable IO';
        element.textContent = name;
        parentCSSElement.element.appendChild(element);

        var cssObject = new THREE.CSS3DObject( element );

        workspace.objectDictionary[cssObject.uuid] = cssObject;
        parentCSSElement.add(cssObject);

        var that = this;

        cssObject.position.z = 0;
        cssObject.position.y = verticalOffset;
        cssObject.position.x = isInput ? -150 : 150;
        cssObject.element.className += isInput ? ' inputIO' : ' outputIO';
        cssObject.addDraggableScopes([isInput ? "input":"output", dragScope]);
        cssObject.addDroppableScopes([isInput ? "output":"input", dragScope]);

        _.defer(function(){
            var glObject = that.createGLElementToMatch(cssObject);
            glObject.setHomePosition(); // snap-back behavior requires IO elements to know their own home positions. With reference to parent, not world!

            // Outputs, when dragged, should draw "stretchy" lines from  their "home" positions to the drag position.
            // When dropped on an acceptable input, this line will be drawn as a permanent "connection" instead
            var stretchy = that.drawCurveFromPointToPoint(glObject.getHomePosition(), glObject.position);
            glObject.parent.add(stretchy);

            // NOTE! We DO NOT DO NOT want to test 'isInput' inside the wire-drawing callback. So the arguments for drawCurveFromPointToPoint
            // need to be defined a scope outside. Testing inside the callback will just re-run the same test for every frame during drag events.
            var curveArguments = [glObject.position, glObject.getHomePosition()];
            if (!isInput) {curveArguments.reverse();}
            glObject.addEventListener('changePosition',function(e){
                // NOTE: When there's a connection to this node, the INTERNAL line SHOULD NOT be redrawn when the overall component is moved!
                // Currently, is is achieved by having separate events for "IO is moving" and "component on which IO lives is moving"
                that.drawCurveFromPointToPoint(curveArguments[0], curveArguments[1], stretchy);
            });
        });

        return cssObject;
    };
    ComponentView.prototype.createInputWithNameAndParent = function(name, dragScope, parentCSSElement,verticalOffset){
        var that = this,
            input = this._createIOWithNameAndParent(name,parentCSSElement, verticalOffset, true, dragScope);
        //input.dfmodel = this.component.inputs[name];
        //console.log(name,this.component);
        input.addEventListener('drop',function(e){
            // TODO: REMOVE THIS EVENT LISTENER WHEN COMPONENT IS DELETED
            that.wireInputToOutputFromComponent(name, e.detail.dropped);
        });
        return input;
    };
    ComponentView.prototype.createOutputWithNameAndParent = function(name, dragScope, parentCSSElement,verticalOffset){
        var output = this._createIOWithNameAndParent(name,parentCSSElement, verticalOffset, false, dragScope);
        output.dfmodel = this.component.output; /* So that the output object can be retrieved during drop events */
        output.componentView = this;
        return output;
    };
    ComponentView.prototype.wireInputToOutputFromComponent = function(inputName, outputFromOtherComponent){

        // register "recalculate" listener for this input on the "dropped" output model
        this.component.assignInput(inputName,outputFromOtherComponent.dfmodel);

        // The input view should listen for registrations and draw the corresponding line.
        // Connection lines will belong to the INPUTS not the OUTPUTS.
        // it is MUCH easier to set up the drawing inside this function, however. To collect everything, I'm doing this first here
        // for motion, though, it must bind to "move" events of the COMPONENT ON WHICH THE CONNECTED OUTPUT RESIDES
        // See glObject.addEventListener('changePosition',function(e){ on line 104 of this file (currently)
        //this.listenTo(outputFromOtherComponent.componentView, 'changePosition', function(){console.log('position change detected for a connected output')});
        var that = this;
        var curveArguments = [ outputFromOtherComponent.componentView.glObject.position,this.glObject.position];
        var stretchy = that.drawCurveFromPointToPoint(curveArguments[0],curveArguments[1]);
        this.glObject.add(stretchy);

        outputFromOtherComponent.componentView.glObject.addEventListener("changePosition",function(){
            that.drawCurveFromPointToPoint(curveArguments[0], curveArguments[1], stretchy);
        });


    };

    // We need the css renderer so that standard DOM components like inputs can be usable, and scaled
    // all the hit calculation and drawing of connections, however, happens in webgl.
    ComponentView.prototype.createGLElementToMatch = function(cssElement){
        var width = cssElement.element.clientWidth, height = cssElement.element.clientHeight;

        // it's possible to hit this line before the css element renders.
        if (width === 0 || height === 0) { throw new Error("CSS Element Must be allowed to render before polling for its size."); }

        var rectShape = new THREE.Shape();
        rectShape.moveTo( 0, 0 );
        rectShape.lineTo( 0, height );
        rectShape.lineTo( width, height );
        rectShape.lineTo( width, 0 );
        rectShape.lineTo( 0, 0 );

        var geometry = new THREE.ShapeGeometry( rectShape );
        geometry.applyMatrix( new THREE.Matrix4().makeTranslation( - width/2,  - height/2, 0) ); // the corresponding css element centers itself on the 3js position
        var mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true, transparent: true, opacity: 0.0 }) );
        mesh.position.set(cssElement.position.x,cssElement.position.y,0);
        cssElement.element.uuid = cssElement.uuid;

        // enable easy lookups in all directions:
        workspace.objectDictionary[mesh.uuid] = mesh;
        workspace.objectDictionary[cssElement.uuid] = cssElement;
        workspace.cssObjectsByGLId[mesh.uuid] = cssElement;
        workspace.glObjectsByCSSId[cssElement.uuid] = mesh;

        // Add to scene if this is a top-level element, otherwise mimick the css-object hierarchy to keep pieces moving together!
        // TODO: Find a better test for "is a THREE.CSS3DObject"
        if (!_.isUndefined(cssElement.parent.element)) {
            // look up the right GL parent:
            workspace.glObjectsByCSSId[cssElement.parent.uuid].add(mesh);
        } else {
            workspace.glscene.add(mesh);
        }

        return mesh;
    };

    ComponentView.prototype.drawCurveFromPointToPoint = function(startPoint,endPoint, mesh){
        // Smoothness of connecting curves.
        var numPoints = 30;

        // calculate intermediate point positions:
        var minControlpointDist = Math.min(200,Math.sqrt( Math.pow((endPoint.x - startPoint.x),2) + Math.pow((endPoint.y - startPoint.y),2)  ));
        var m1 = new THREE.Vector3(Math.max(startPoint.x +minControlpointDist,startPoint.x + 2*(endPoint.x - startPoint.x)/3), startPoint.y , 0),
            m2 = new THREE.Vector3(Math.min(endPoint.x-minControlpointDist,endPoint.x - 2*(endPoint.x - startPoint.x)/3), endPoint.y, 0),
            spline = new THREE.CubicBezierCurve3(
                startPoint,
                m1,
                m2,
                endPoint
            );

        var createNew = _.isUndefined(mesh),
            geometry = createNew ? new THREE.Geometry : mesh.geometry,
            splinePoints = spline.getPoints(numPoints);

        // approximate the curve in numPoints line segments
        for(var i = 0; i < splinePoints.length; i++){
            geometry.vertices[i]=splinePoints[i];
        }

        // For re-used meshes: https://github.com/mrdoob/three.js/wiki/Updates
        geometry.verticesNeedUpdate = true;

        if (createNew) {
            var material = new THREE.LineBasicMaterial({ color: 0xffffff });
            var mesh = new THREE.Line(geometry, material);
            mesh.frustumCulled = false; /* THIS IS IMPORTANT! It keeps the lines from disappearing when (0,0,0) goes offscreen due to a pan! */
        }

        return mesh;
    };

    return ComponentView;
});