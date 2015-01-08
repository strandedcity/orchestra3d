define([
    'dataFlow/dataFlow_loader',
    "dataFlow/UI/workspaceView",
    "dataFlow/UI/inputOutputView",
    "underscore",
    "backbone"
],function(DataFlow, workspace, ioView, _, Backbone){
    var INPUT_HEIGHT = 60;

    /* Almost all components will use the regular ol' component view. But as other view types evolve, they can be employed easily here */
    function ComponentViewSelector(component){
        if (_.isUndefined(component) || _.isUndefined(component.recalculate) ) {
            throw new Error('ComponentView objects must be instantiated with the DataFlow.Component which they represent');
        }

        if (component.componentName === "SliderComponent") {
            return new SliderComponentView(component);
        } else if (component.componentName === "NumberComponent") {
            return new EditableNumberComponentView(component);
        } else {
            return new ComponentView(component);
        }
    }

    function SliderComponentView(component) {
        /* This refers only to the dataflow component, not the actual slider. So here, we handle events that interface with
         * the slider, but not the display of the slider itself. */
        var that = this;
         _.extend(this,ComponentView.prototype,{
            // Show Slider UI
            click: function(x,y){
                // Show the slider and overlay. It cleans up itself.
                var val = component.output.getFirstValueOrDefault(),
                    min = component["S"].getFirstValueOrDefault(),
                    max = component["E"].getFirstValueOrDefault(),
                    integers =  component["I"].getFirstValueOrDefault(),
                    callback = this.sliderUpdateValue;
                require(["dataFlow/UI/sliderView"],function(SliderView){
                    // no reference necessary. The slider will clean itself up.
                    new SliderView(val,min,max,integers,x,y,callback);
                });
            },
            sliderUpdateValue: function(value){
                component.output.assignValues([value],[0]);
                that.displayVals();
            },
            displayVals: function(){
                if (_.isEmpty(this.component.output.values.dataAtPath([0]))) {
                    this.cssObject.element.firstChild.value = this.component.get('componentPrettyName');
                } else {
                    this.cssObject.element.firstChild.value = this.component.output.values.dataAtPath([0]).toString();
                }
            }
        });
        _.bindAll(this,"click","sliderUpdateValue");

        this.init(component);
     }


    /* Editable Number Components let you type numbers directly into the component */
    function EditableNumberComponentView(component){
        _.extend(this,ComponentView.prototype,{
            displayVals: function(){
                if (_.isEmpty(this.component.output.values.dataAtPath([0]))) {
                    this.cssObject.element.firstChild.value = this.component.get('componentPrettyName');
                } else {
                    this.cssObject.element.firstChild.value = this.component.output.values.dataAtPath([0]).toString();
                }
            }
        });
        _.bindAll(this,"displayVals");

        this.init(component);

        // bind some extra events for the editable number components.
        var that = this;
        this.listenTo(this.component.output,"change",this.displayVals);

        console.warn("DON'T DO THIS! OR, DESTROY THE EVENT LISTENER LATER");
        this.cssObject.element.firstChild.onchange = function(){
            that.component.parseInputAndSet(this.value);
        };
    }

    ///////////////////////
    // BEGIN GENERIC COMPONENTVIEW METHODS
    ///////////////////////
    function ComponentView(component){
        this.init(component);
    }

    ComponentView.prototype.init = function(component){
        this.component = component;

        _.extend(this,Backbone.Events);

        _.bindAll(this,"createInputWithNameAndParent","createGLElementToMatch");
        this.cssObject = this.createComponentWithNamePosition(this.component.get('componentPrettyName'), this.component.position.x, this.component.position.y);

        _.defer(function(){
            this.glObject = this.createGLElementToMatch(this.cssObject);
            workspace.setupDraggableView(this);  // make the view draggable!
        }.bind(this));

        component.componentView = this;
        this.inputViews = {};
        this.outputView = null;
        this.createInputs();
        this.createOutputs();

        // call once at the end!
        workspace.render();

        // With dom elements created, bind events:
        this.listenTo(this.component,"sufficiencyChange",this.changeSufficiency);
        this.changeSufficiency(this.component.hasSufficientInputs());
        this.listenTo(this.component,"change:componentPrettyName",this.displayVals);
        this.listenTo(this.component,"removed",this.remove);
    };

    ComponentView.prototype.displayVals = function(){
        this.cssObject.element.firstChild.value = this.component.get('componentPrettyName');
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

        // Delete input views first, the connections live there
        _.each(this.component.inputs,function(ipt){
            if (!_.isEmpty(ipt.IOView)) ipt.IOView.remove();
        });

        if (!_.isEmpty(this.component.output.IOView)) {
            this.component.output.IOView.remove();
        }

        workspace.scene.remove(this.cssObject);
        workspace.glscene.remove(this.glObject);
        delete this.component.componentView; // remove references to the view
        delete this.component; // shouldn't be necessary but can't really hurt

        workspace.render(); // get rid of input wires
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
            if (ipt.type !== DataFlow.OUTPUT_TYPES.NULL) {
                that.inputViews[ipt.shortName] = this.createInputWithNameAndParent(ipt.shortName,ipt.type,this.cssObject, verticalStart - idx * INPUT_HEIGHT );
            }
        },this);
    };

    ComponentView.prototype.createOutputs = function(){
        if (this.component.output.type === DataFlow.OUTPUT_TYPES.NULL) return;
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

    return ComponentViewSelector;
});