define([
    'dataFlow/dataFlow_loader',
    "dataFlow/UI/workspaceView",
    "dataFlow/UI/inputOutputView",
    "underscore",
    "backbone",
    "dataFlow/dataTree"
],function(DataFlow, workspace, ioView, _, Backbone, DataTree){
    var INPUT_HEIGHT = 60;

    /* Almost all components will use the regular ol' component view. But as other view types evolve, they can be employed easily here */
    function ComponentViewSelector(component){
        if (_.isUndefined(component) || (_.isUndefined(component.recalculate) && _.isUndefined(component.recalculateTrees)) ) {
            throw new Error('ComponentView objects must be instantiated with the DataFlow.Component which they represent');
        }

        if (component.componentName === "SliderComponent") {
            return new SliderComponentView(component);
        } else if (component.componentName === "NumberComponent") {
            return new EditableNumberComponentView(component);
        } else if (component.componentName === "BooleanToggleComponent") {
            console.log('creating toggler')
            return new BooleanToggleComponentView(component);
        } else {
            return new ComponentView(component);
        }
    }

    function BooleanToggleComponentView(component){
        /* This refers only to the dataflow component, not the actual slider. So here, we handle events that interface with
         * the slider, but not the display of the slider itself. */
        var that = this;
        _.extend(this,ComponentView.prototype,{
            // Show Slider UI
            doubleclick: function(x,y){
                // change boolean value on double click
                var currValTree = that.component.getInput("B").getTree();
                currValTree.setDataAtPath(!currValTree.dataAtPath([0])[0],[0]);
            },
            displayVals: function(){
                if (_.isEmpty(this.component.getOutput("B").getTree().dataAtPath([0]))) {
                    this.setDisplayLabel(this.component.get('componentPrettyName'));
                } else {
                    this.setDisplayLabel(this.component.getOutput("B").getTree().dataAtPath([0]).toString());
                }
            }
        });

        this.init(component);

        this.listenTo(this.component.getOutput("B"),"change",this.displayVals);
    }

    function SliderComponentView(component) {
        /* This refers only to the dataflow component, not the actual slider. So here, we handle events that interface with
         * the slider, but not the display of the slider itself. */
        var that = this;
         _.extend(this,ComponentView.prototype,{
            // Show Slider UI
            click: function(x,y){
                // Show the slider and overlay. It cleans up itself.
                var val = component.getOutput("N").getFirstValueOrDefault(),
                    min = component.getInput("S").getFirstValueOrDefault(),
                    max = component.getInput("E").getFirstValueOrDefault(),
                    integers =  component.getInput("I").getFirstValueOrDefault(),
                    callback = this.sliderUpdateValue;
                require(["dataFlow/UI/sliderView"],function(SliderView){
                    // no reference necessary. The slider will clean itself up.
                    new SliderView(val,min,max,integers,x,y,callback);
                });
            },
            sliderUpdateValue: function(value){
                // this component uses IOs differently than other components so that the value
                // can persist successfully, be fed into the slider view, trigger recalculations, etc.
                component.storeUserData(value);
                that.displayVals();
            },
            displayVals: function(){
                if (_.isEmpty(this.component.getOutput("N").getTree().dataAtPath([0]))) {
                    this.setDisplayLabel(this.component.get('componentPrettyName'));
                } else {
                    this.setDisplayLabel(this.component.getOutput("N").getTree().dataAtPath([0]).toString());
                }
            }
        });
        _.bindAll(this,"click","sliderUpdateValue");

        this.init(component);
     }


    /* Editable Number Components let you type numbers directly into the component */
    function EditableNumberComponentView(component){
        _.extend(this,ComponentView.prototype,{
            click: function(x,y){
                // Show the table-number-enterer UI. It cleans up after itself.
                var data = component.getInput("N").get('persistedData') || new DataTree(),
                    callback = function(tree){
                        component.getInput("N").assignPersistedData(tree);
                    };
                require(["dataFlow/UI/tableValueEnterer"],function(TableView){
                    // no reference necessary. The slider will clean itself up.
                    new TableView(data,x,y,callback);
                });
            }
        });
        _.bindAll(this,"click");

        this.init(component);
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

        _.bindAll(this,"processIOViews","createGLElementToMatch");
        this.cssObject = this.createComponentWithNamePosition(this.component.get('componentPrettyName'), this.component.position.x, this.component.position.y);

        _.defer(function(){
            this.glObject = this.createGLElementToMatch(this.cssObject);
            workspace.setupDraggableView(this);  // make the view draggable!
            if (this.component.get('sufficient') == true) this.changeSufficiency();
            this.listenTo(this.glObject,"changePosition",function(){component.position = this.glObject.position;});
        }.bind(this));

        component.componentView = this;
        this.inputViews = {};
        this.outputViews = {};
        this.processIOViews(this.component.inputs,this.inputViews,true);
        this.processIOViews(this.component.outputs,this.outputViews,false);

        // call once at the end!
        workspace.render();

        // With dom elements created, bind events:
        this.listenTo(this.component,"change:preview",this.changePreviewState);
        this.listenTo(this.component,"change:sufficient",this.changeSufficiency);
        this.listenTo(this.component,"change:componentPrettyName",this.displayVals);
        this.listenTo(this.component,"removed",this.remove);

        // Initial rendering states
        this.changePreviewState();
        this.changeSufficiency();
    };

    ComponentView.prototype.displayVals = function(){
        this.setDisplayLabel(this.component.get('componentPrettyName'));
    };

    ComponentView.prototype.doubleclick = function(){
        // default double-clicking just logs the data from the first output
        this.component.getOutput().getTree().log();
    };

    ComponentView.prototype.changeSufficiency = function(){
        var state = this.component.get("sufficient");

        var classToAdd;
        if (state === true) classToAdd = "sufficient";
        else if (state === "error") classToAdd = "error";
        else classToAdd = "insufficient";

        var displayDiv = this.getDisplayDiv();
        displayDiv.classList.remove("sufficient");
        displayDiv.classList.remove("insufficient");
        displayDiv.classList.remove("error");
        displayDiv.classList.add(classToAdd);
    };

    ComponentView.prototype.changePreviewState = function(){
        // true or false, but default component display assumes preview on. There's only one CSS class to manage.
        var state = this.component.get("preview"); 

        var displayDiv = this.getDisplayDiv(),
            previewOffClass = "previewOff";
        displayDiv.classList.remove(previewOffClass);
        if (state === false) {
            displayDiv.classList.add(previewOffClass);
        }
    };

    ComponentView.prototype.getDisplayDiv = function(){
        return this.cssObject.element.firstChild;
    };

    ComponentView.prototype.setDisplayLabel = function(text){
        this.getDisplayDiv().textContent = text;
    };

    ComponentView.prototype.createComponentWithNamePosition = function(name, x, y){
        var element = document.createElement( 'div' );
        element.className = 'draggable';

        var label = document.createElement( 'div' );
        label.className = 'componentLabel';
        label.textContent = name;
        element.appendChild( label );

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

        _.each(this.component.outputs,function(out){
            if (!_.isEmpty(out.IOView)) {
                out.IOView.remove();
            }
        });

        workspace.scene.remove(this.cssObject);
        workspace.glscene.remove(this.glObject);
        delete this.component.componentView; // remove references to the view
        delete this.component; // shouldn't be necessary but can't really hurt

        workspace.render(); // get rid of input wires
    };

    ComponentView.prototype.processIOViews = function(IOModelArray,IOViewsArray,inputsBoolean){
        var invisibleInputCount = _.filter(IOModelArray, function(input){ return input.get('invisible') === true; }).length,
            verticalStart = INPUT_HEIGHT * (_.keys(IOModelArray).length - 1 - invisibleInputCount) / 2,
            cssObj = this.cssObject,
            ioViewConstructor = inputsBoolean ? ioView.InputView : ioView.OutputView;

        _.each(IOModelArray, function(ioModel,idx){
            if (ioModel.type !== DataFlow.OUTPUT_TYPES.NULL && ioModel.get('invisible') !== true) {
                //this.createOutputWithNameAndParent(ioModel.shortName,ioModel.type,this.cssObject,verticalStart - idx * INPUT_HEIGHT);

                var name = ioModel.shortName,
                    outputCSSObj = this._createIOWithNameAndParent(
                        name,
                        cssObj,
                        verticalStart - idx * INPUT_HEIGHT,
                        inputsBoolean,
                        ioModel.type
                    ),
                    that = this;

                _.defer(function(){
                    var glObject = that.createGLElementToMatch(outputCSSObj);
                    IOViewsArray[name] = new ioViewConstructor(ioModel,glObject,outputCSSObj);
                });
            }
        },this);
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