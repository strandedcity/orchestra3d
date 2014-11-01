define(["dataFlow/dataFlow_loader"],function(dataFlow){
    return ["Components -->",function(){
        describe("PointComponent(x,y,z)",function(){
            var outputX, outputY, outputZ, pointComponent;

            beforeEach(function(){
                // "outputs" are actually inputs to the "point" component. They are outputs
                // in the sense that they are assumed to be emitted from a prior component.
                // Output objects are tested separately in DataFlow --> Core --> Output Objects
                outputX = new dataFlow.OutputNumber();
                outputY = new dataFlow.OutputNumber();
                outputZ = new dataFlow.OutputNumber();

                outputX.assignValues([1,2]);
                outputY.assignValues([2,4]);
                outputZ.assignValues([4,8]);

                pointComponent = new dataFlow.PointComponent();
            });

            // Each test is separate, but we'll need to assign inputs for several of them (not all)
            var assignInputs = function(){
                pointComponent.assignInput("X",outputX);
                pointComponent.assignInput("Y",outputY);
                pointComponent.assignInput("Z",outputZ);
            };

            it("Has a constructor named 'PointComponent'",function(){
                expect(pointComponent.constructor.name).toEqual("PointComponent");
            });
            it("Should assign numerical inputs to the dataFlow Point object",function(){
                assignInputs();
                expect(pointComponent.inputs["X"]).toEqual(outputX);
                expect(pointComponent.inputs["Y"]).toEqual(outputY);
                expect(pointComponent.inputs["Z"]).toEqual(outputZ);
            });
            it("Should call _recalculate() in the superclass when recalculate() is called",function(){
                assignInputs();
                spyOn(pointComponent, '_recalculate');
                pointComponent.recalculate();
                expect(pointComponent._recalculate).toHaveBeenCalled();
            });
            it("Should trigger recalculation when an input value changes",function(){
                assignInputs();

                // Just to make sure the decks are clear first.
                pointComponent.recalculate();

                // assigning values to an input should update all the output values automatically
                // IF there are sufficient inputs for the calculation to occur
                spyOn(pointComponent,'_recalculate'); // spying on 'recalculate' won't work because of prototype inheritance
                outputX.assignValues([8,8]);
                expect(pointComponent._recalculate).toHaveBeenCalled();
                expect(pointComponent.output.fetchValues()[0].getCoordsArray()).toEqual([8,2,4]);
                expect(pointComponent.output.fetchValues()[1].getCoordsArray()).toEqual([8,4,8]);
            });
            it("Should NOT recalculate when insufficient inputs are defined", function(){
                assignInputs();
                pointComponent.recalculate();

                // null-out the Y-input:
                outputY.setNull(true);

                // assigning values to an input should update all the output values automatically
                // IF there are sufficient inputs for the calculation to occur
                spyOn(pointComponent,'_recalculate');
                outputX.assignValues([8,8]);
                expect(pointComponent._recalculate).not.toHaveBeenCalled();
            });
            it("Should have null output when any input is set to null", function(){
                assignInputs();
                pointComponent.recalculate();

                // null-out the Y-input:
                outputY.setNull(true);
                expect(pointComponent.isNull()).toBe(true);
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
                spyOn(pointComponent, '_recalculate');
                assignInputs();
                expect(pointComponent._recalculate).toHaveBeenCalled();
                var pointCoordinates = pointComponent.fetchPointCoordinates();
                expect(pointCoordinates).toEqual([[1,2,4],[2,4,8]]);
            });
            it("Returns an array of GeoPoints when fetchOutputs() is called",function(){
                assignInputs();
                pointComponent.recalculate();
                var outputs = pointComponent.fetchOutputs();
                _.each(outputs,function(out){
                    expect(out.constructor.name).toEqual("GeoPoint");
                });
                expect(outputs.length).toEqual(2);
            });
            it("Listens ONLY to a new input when that input is re-assigned",function(){
                assignInputs();
                spyOn(pointComponent, '_recalculate');

                // create new input
                var outputZReplacement = new dataFlow.OutputNumber();
                outputZReplacement.assignValues([9,10]);
                pointComponent.assignInput("Z",outputZReplacement);

                // Verify component has recalculated based on new input
                expect(pointComponent._recalculate.calls.count()).toEqual(1);
                expect(pointComponent.fetchPointCoordinates()).toEqual([[1,2,9],[2,4,10]]);

                // verify we're NOT listening to the old input
                // Documentation for spy usage at:
                // http://jasmine.github.io/2.0/introduction.html#section-23
                outputZ.assignValues([2,2]);
                expect(pointComponent._recalculate.calls.count()).toEqual(1);
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
        })
    }];
});
