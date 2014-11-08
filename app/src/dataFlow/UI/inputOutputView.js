define([
    'dataFlow/dataFlow_loader',
    "dataFlow/UI/workspaceView",
    "underscore",
    "threejs"
],function(DataFlow, workspace, _){

    /* Base class IOView */
    function IOView(ioModel,glObject,cssObject){
        if (_.isUndefined(ioModel) || _.isUndefined(glObject) || _.isUndefined(cssObject) ) {
            throw new Error('IOView must be passed a model and associated GL and CSS Views');
        }

        // refs work both ways
        this.model = ioModel;
        this.glObject = glObject;
        this.cssObject = cssObject;
        this.model.IOView = this;
        this.glObject.IOView = this;
        this.cssObject.IOView = this;

        _.extend(this, Backbone.Events);

        // The backbone way: listen to data changes to make view changes
        this.listenTo(this.model,"connectedOutput",this.connectToOutput);

        this._remove = function(){
            this.stopListening();
            delete this.glObject.IOView;
            delete this.cssObject.IOView;
            this.stretchy.remove();
            this.glObject.remove();
            this.cssObject.remove();

            delete this.model.IOView;
            delete this.model;
            delete this.glObject;
            delete this.cssObject;
            delete this;
        };
        this.setupStretchyWire = function(){
            // All inputs and outputs are connected via a "stretchy band" to their home positions
            // When dropped on an acceptable input, this line will be drawn as a permanent "connection" instead
            this.glObject.setHomePosition(); // snap-back behavior requires IO elements to know their own home positions. With reference to parent, not world!
            this.stretchy = workspace.drawCurveFromPointToPoint(this.glObject.getHomePosition(), this.glObject.position);
            this.glObject.parent.add(this.stretchy);

            // NOTE! We want to do as little as possible inside the wire-drawing callback. So the start and end positions are defined by reference a scope outside.
            this.stretchyCurveArguments = [glObject.position, glObject.getHomePosition()];
            this.listenTo(this.glObject,"changePosition",function(){
                // NOTE: When there's a connection to this node, the INTERNAL line SHOULD NOT be redrawn when the overall component is moved!
                // Currently, this works because this event listener is attached to the IOView's "changePosition" event, not the component's
                workspace.drawCurveFromPointToPoint(this.stretchyCurveArguments[0], this.stretchyCurveArguments[1], this.stretchy);
            });
        };

        workspace.setupDraggableView(this);  // make the view draggable!
        this.setupStretchyWire();
    }


    /* Input Views Are responsible for drawing connection wires and handling drop events that change data flow */
    function InputView(inputModel,glObject,cssObject) {
        IOView.call(this,inputModel,glObject,cssObject);
        this.connectedOutputViews = [];
        this.connectionWires = [];

        // register event listeners! Both inputs and outputs need to pass through events when their parents move around:
        var that = this;

        // When moving the INPUT'S Component, all the wires connected to the input should be redrawn:
        this.listenTo(this.glObject.parent,"changePosition",function(){
            _.each(this.connectedOutputViews,function(outputView,idx){
                that.redrawWireForConnectedOutput(outputView,that.connectionWires[idx]);
            });
        });

        // Inputs handle drop events directly. Triggered in the workspaceView!
        this.listenTo(this.cssObject, "drop", function(droppedCSSObj){
            this.model.connectOutput(droppedCSSObj.IOView.model);
        });
    }

    InputView.prototype.remove = function(){
        // input-specific cleanup
        var that = this;
        _.each(this.connectionWires,function(wireView){that.glObject.parent.parent.remove(wireView)});
        _.each(this.connectedOutputViews,function(outputView){
            console.log("TODO: DISCONNECT LISTENERS FOR OUTPUTS WHEN REMOVING AN INPUT");
        });
        this._remove();
    };

    InputView.prototype.connectToOutput = function(output){
        var outputView = output.IOView;

        // must pre-render to make sure that the matrices for the referenced GL elements are updated
        workspace.render();

        var that = this;
        this.connectedOutputViews.push(outputView);
        var wireView = this.redrawWireForConnectedOutput(outputView);
        this.glObject.parent.parent.add(wireView); // Adding the wire to the input or component slows rendering for reasons I don't totally understand. But it doesn't matter.
        this.connectionWires.push(wireView);
        this.listenTo(outputView.glObject.parent,"changePosition",function(){
            that.redrawWireForConnectedOutput(outputView,wireView);
        });

        // post-render to make sure the wire gets drawn
        workspace.render();
    };
    InputView.prototype.redrawWireForConnectedOutput = function(outputView,wireView){
        outputView.glObject.updateMatrixWorld();
        this.glObject.updateMatrixWorld();

        var end = (new THREE.Vector3()).setFromMatrixPosition(this.glObject.matrixWorld),
            start = (new THREE.Vector3()).setFromMatrixPosition(outputView.glObject.matrixWorld);

        return workspace.drawCurveFromPointToPoint(start,end,wireView);
    };

    function OutputView(inputModel,glObject,cssObject) {
        IOView.call(this,inputModel,glObject,cssObject);

        // The internal "stretchy band" is still oriented left-to-right, so must be drawn in the correct order for Outputs also:
        this.stretchyCurveArguments.reverse();
    }
    OutputView.prototype.remove = function(){
        // output-specific cleanup
        this._remove(); // IOView Superclass
    };

    return {
        InputView: InputView,
        OutputView: OutputView
    };
});