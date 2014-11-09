define([
    'dataFlow/dataFlow_loader',
    "dataFlow/UI/workspaceView",
    "dataFlow/UI/inputOutputView",
    "underscore",
    "backbone"
],function(DataFlow, workspace, ioView, _, Backbone){
    var INPUT_HEIGHT = 60;

    function ComponentView(component){
        if (_.isUndefined(component) || _.isUndefined(component.recalculate) ) {
            throw new Error('ComponentView objects must be instantiated with the DataFlow.Component which they represent');
        }
        this.component = component;  // data model reference is kept here
        this.init();
    }

    ComponentView.prototype.init = function(){
        _.extend(this,Backbone.Events);

        _.bindAll(this,"createInputWithNameAndParent","createGLElementToMatch","displayVals");
        this.cssObject = this.createComponentWithNamePosition(this.component.componentPrettyName, this.component.position.x, this.component.position.y);

        _.defer(function(){
            this.glObject = this.createGLElementToMatch(this.cssObject);
            workspace.setupDraggableView(this);  // make the view draggable!
        }.bind(this));

        this.inputViews = {};
        this.outputView = null;
        this.createInputs();
        this.createOutputs();

        // call once at the end!
        workspace.render();

        // With dom elements created, bind events:
        if (this.component.output.type === 'number') {
            this.listenTo(this.component.output,"change",this.displayVals);
        }
        this.listenTo(this.component,"sufficiencyChange",this.changeSufficiency);
        this.changeSufficiency(this.component.hasSufficientInputs());
    };

    ComponentView.prototype.displayVals = function(){
        if (_.isEmpty(this.component.output.values)) {
            this.cssObject.element.firstChild.value = this.component.componentPrettyName;
        } else {
            this.cssObject.element.firstChild.value = this.component.output.values.toString();
        }
    };

    ComponentView.prototype.changeSufficiency = function(state){
        var classToAdd;
        if (state === true) classToAdd = "sufficient";
        if (state === false) classToAdd = "insufficient";
        if (state === "error") classToAdd = "error";

        this.cssObject.element.firstChild.classList.remove("sufficient");
        this.cssObject.element.firstChild.classList.remove("insufficient");
        this.cssObject.element.firstChild.classList.remove("error");
        this.cssObject.element.firstChild.classList.add(classToAdd);
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

        return cssObject;
    };

    ComponentView.prototype.remove = function(){
        this.stopListening();

        // remove inputs
        // remove gl element
        // remove css element
    };


    /*
    Inputs and Outputs!
     */
    ComponentView.prototype.createInputs = function(){
        // calculate start position for inputs:
        var inputs = this.component.inputs,
            that = this;
        var verticalStart = INPUT_HEIGHT * (_.keys(inputs).length - 1) / 2;

        // add each input:
        _.each(inputs, function(ipt,idx){
            that.inputViews[ipt.shortName] = this.createInputWithNameAndParent(ipt.shortName,ipt.type,this.cssObject, verticalStart - idx * INPUT_HEIGHT );
        },this);
    };

    ComponentView.prototype.createOutputs = function(){
        this.createOutputWithNameAndParent(this.component.output.shortName,this.component.output.type,this.cssObject,0);
    };
    ComponentView.prototype.createInputWithNameAndParent = function(name, dragScope, parentCSSElement,verticalOffset){
        var that = this,
            inputCSSObj = this._createIOWithNameAndParent(name,parentCSSElement, verticalOffset, true, dragScope);

        _.defer(function(){
            var glObject = that.createGLElementToMatch(inputCSSObj);
            that.inputViews[name] = new ioView.InputView(that.component[name],glObject,inputCSSObj);
        });
        return inputCSSObj;
    };
    ComponentView.prototype.createOutputWithNameAndParent = function(name, dragScope, parentCSSElement,verticalOffset){
        var outputCSSObj = this._createIOWithNameAndParent(name,parentCSSElement, verticalOffset, false, dragScope),
            that = this;

        _.defer(function(){
            var glObject = that.createGLElementToMatch(outputCSSObj);
            that.outputView = new ioView.OutputView(that.component.output,glObject,outputCSSObj);
        });
        return outputCSSObj;
    };
    ComponentView.prototype._createIOWithNameAndParent = function(name, parentCSSElement, verticalOffset, isInput, dragScope){
        var element = document.createElement("div");
        element.className = 'draggable IO';
        element.textContent = name;
        parentCSSElement.element.appendChild(element);

        var cssObject = new THREE.CSS3DObject( element );

        parentCSSElement.add(cssObject);

        cssObject.position.z = 0;
        cssObject.position.y = verticalOffset;
        cssObject.position.x = isInput ? -150 : 150;
        cssObject.element.className += isInput ? ' inputIO' : ' outputIO';
        cssObject.addDraggableScopes([isInput ? "input":"output", dragScope]);
        cssObject.addDroppableScopes([isInput ? "output":"input", dragScope]);

        return cssObject;
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

        // If this.glObject is defined, we're talking about a child to be added (ie, an input's glObject)
        // Otherwise, we're talking about the component itself:
        var glParent = !_.isUndefined(this.glObject) ? this.glObject : workspace.glscene;
        glParent.add(mesh);

        return mesh;
    };

    return ComponentView;
});