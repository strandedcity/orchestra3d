define(["dataFlow/dataFlow_loader","SISL/sisl_loader"],function(dataFlow,Geo){
    return ["PointComponent(x,y,z)",function(){
        var outputX, outputY, outputZ, pointComponent;

        beforeEach(function(done){
            // "outputs" are actually inputs to the "point" component. They are outputs
            // in the sense that they are assumed to be emitted from a prior component.
            // Output objects are tested separately in DataFlow --> Core --> Output Objects
            outputX = new dataFlow.components.number.NumberComponent();
            outputY = new dataFlow.components.number.NumberComponent();
            outputZ = new dataFlow.components.number.NumberComponent();

            outputX.getInput("N").assignPersistedData([1,2]);
            outputY.getInput("N").assignPersistedData([2,4]);
            outputZ.getInput("N").assignPersistedData([4,8]);
            console.log("VALUES Output from NUMBER:");
            outputX.getOutput("N").values.log();

            pointComponent = new dataFlow.components.point.PointComponent();
            setTimeout(function(){
                console.log("-------------");
                done();
            },50);
        });

        // Each test is separate, but we'll need to assign inputs for several of them (not all)
        var assignInputs = function(){
            pointComponent.assignInput("X", outputX.getOutput("N"));
            pointComponent.assignInput("Y", outputY.getOutput("N"));
            pointComponent.assignInput("Z", outputZ.getOutput("N"));
        };

        it("Has a constructor named 'PointComponent'",function(){
            expect(pointComponent.componentName).toEqual("PointComponent");
        });
        it("Should assign numerical inputs to the dataFlow Point object",function(done){
            assignInputs();
            // tests the setup
            expect(outputX.getOutput("N").getTree().dataAtPath([0])).toEqual([1,2]);

            setTimeout(function(){
                expect(pointComponent["X"].getTree().dataAtPath([0])).toEqual(outputX.getOutput("N").getTree().dataAtPath([0]));
                expect(pointComponent["Y"].getTree().dataAtPath([0])).toEqual(outputY.getOutput("N").getTree().dataAtPath([0]));
                expect(pointComponent["Z"].getTree().dataAtPath([0])).toEqual(outputZ.getOutput("N").getTree().dataAtPath([0]));
                done();
            },50);
        });
        it("Should call recalculate() ONCE when all inputs are connected",function(done){
            spyOn(pointComponent, 'recalculate');
            pointComponent.assignInput("X", outputX.getOutput("N"));
            pointComponent.assignInput("Y", outputY.getOutput("N"));
            pointComponent.assignInput("Z", outputZ.getOutput("N"));
            setTimeout(function(){
                expect(pointComponent.recalculate.calls.count()).toEqual(1);
                done();
            },50);
        });
        it("Should trigger recalculation when an input value changes",function(done){
            assignInputs();

            setTimeout(function(){
                // assigning values to an input should update all the output values automatically
                // IF there are sufficient inputs for the calculation to occur
                spyOn(pointComponent,'simulatedRecalculate'); // spying on 'recalculate' won't work because of prototype inheritance
                expect(pointComponent.simulatedRecalculate.calls.count()).toEqual(0);
                outputX.getInput("N").assignPersistedData([8,8]);

                setTimeout(function(){
                    expect(pointComponent.simulatedRecalculate.calls.count()).toEqual(1);
                    expect(pointComponent.getOutput("P").getTree().dataAtPath([0])[0].toArray()).toEqual([8,2,4]);
                    expect(pointComponent.getOutput("P").getTree().dataAtPath([0])[1].toArray()).toEqual([8,4,8]);
                    done();
                },50);
            },50);

        });
        it("Should NOT recalculate when insufficient inputs are defined", function(){
            assignInputs();
            spyOn(pointComponent,'simulatedRecalculate');

            // null-out the Y-input:
            outputY.clear(true);

            // assigning values to an input should update all the output values automatically
            // IF there are sufficient inputs for the calculation to occur
            setTimeout(function(){

                outputX.assignValues([8,8]);
                expect(pointComponent.simulatedRecalculate).not.toHaveBeenCalled();
            },50);
        });
        it("Should have null output when any input is set to null", function(done){
            assignInputs();
            pointComponent.recalculate();

            // null-out the Y-input:
            outputY.clear(true);
            setTimeout(function(){
                expect(pointComponent.isNull()).toBe(true);
                done();
            },50);
        });
        it("Returns an array of xyz values when fetchPointCoordinates() is called",function(){
            assignInputs();
            pointComponent.recalculate();
            var pointCoordinates = pointComponent.fetchPointCoordinates();
            expect(pointCoordinates).toEqual([[1,2,4],[2,4,8]]);
        });
        it("Should calculate output when inputs are satisfied",function(){
            // Test should be same as above, but without explicit calling of "recalculate".
            // We're testing here to make sure the component knows to recalculate. Above, we're testing
            // that it recalculates correctly.
            spyOn(pointComponent, 'simulatedRecalculate');
            assignInputs();
            expect(pointComponent.simulatedRecalculate).toHaveBeenCalled();
            var pointCoordinates = pointComponent.fetchPointCoordinates();
            expect(pointCoordinates).toEqual([[1,2,4],[2,4,8]]);
        });
        it("Returns an array of GeoPoints when fetchOutputs() is called",function(){
            assignInputs();
            pointComponent.recalculate();
            var outputs = pointComponent.fetchOutputs();
            _.each(outputs,function(out){
                expect(out.constructor).toEqual(Geo.Point);
            });
            expect(outputs.length).toEqual(2);
        });
        it("Listens ONLY to a new input when that input is re-assigned",function(){
            assignInputs();
            console.clear();
            console.log("------------------\nBEGIN SPYING");
            spyOn(pointComponent, 'simulatedRecalculate');

            // create new input
            var outputZReplacement = new dataFlow.Output({type: dataFlow.OUTPUT_TYPES.NUMBER, shortName: "N"});
            outputZReplacement.assignValues([9,10]);
            expect(pointComponent.simulatedRecalculate.calls.count()).toEqual(0);
            pointComponent.assignInput("Z",outputZReplacement);

            // Verify component has recalculated based on new input
            expect(pointComponent.simulatedRecalculate.calls.count()).toEqual(1);
            expect(pointComponent.fetchPointCoordinates()).toEqual([[1,2,9],[2,4,10]]);

            //// verify we're NOT listening to the old input
            //// Documentation for spy usage at:
            //// http://jasmine.github.io/2.0/introduction.html#section-23
            outputZ.getInput("N").assignPersistedData([2,2]);
            expect(pointComponent.simulatedRecalculate.calls.count()).toEqual(1);
            expect(pointComponent.fetchPointCoordinates()).toEqual([[1,2,9],[2,4,10]]);
        });
        it("Has a null output value until all inputs are assigned",function(){
            spyOn(pointComponent, '_recalculate');
            pointComponent.assignInput("X",outputX);
            expect(pointComponent.isNull()).toBe(true);
            expect(pointComponent._recalculate).not.toHaveBeenCalled();

            pointComponent.assignInput("Y",outputY);
            expect(pointComponent.isNull()).toBe(true);
            expect(pointComponent._recalculate).not.toHaveBeenCalled();

            // setting the z-input completes the inputs, and should trigger calculations:
            pointComponent.assignInput("Z",outputZ);
            expect(pointComponent.isNull()).toBe(false);
            expect(pointComponent._recalculate).toHaveBeenCalled();
            expect(pointComponent.fetchOutputs().length).toBe(2);
        });
        it("Calls destroy() on Geo.Point when a point is replaced with a new point")
    }];
});
