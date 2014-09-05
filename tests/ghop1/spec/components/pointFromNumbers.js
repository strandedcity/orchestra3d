define(["dataFlow"],function(dataFlow){
    return ["Components:",function(){
        describe("PointComponent(x,y,z)",function(){
            var outputX, outputY, outputZ, pointComponent;

            beforeEach(function(){
                // "outputs" are actually inputs to the "point" component. They are outputs
                // in the sense that they are assumed to be emitted from a prior component.
                // Output objects are tested separately in DataFlow --> Core --> Output Objects
                outputX = new dataFlow.Output({type: 'number'});
                outputY = new dataFlow.Output({type: 'number'});
                outputZ = new dataFlow.Output({type: 'number'});

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
            it("Creates an array of points with the correct xyz locations",function(){
console.warn("TEST IS A MESS. FIX.");
                assignInputs();
                pointComponent.recalculate();

                //console.warn("After recalculation, there's a lot of code here to read the values back out. These should move to a utility class somewhere, since they're going to be useful everywhere. PERHAPS MOVE ONTO THE POINT COMPONENT ITSELF!");
                //console.warn("USE MOCK OBJECTS. See http://www.htmlgoodies.com/html5/javascript/spy-on-javascript-methods-using-the-jasmine-testing-framework.html#fbid=OUGNUC05Zto");

                // pointObject.fetchValues() should provide access to the output's pointer list

                var pointers = pointComponent.output.fetchValues();
                var outputVals = [];
                //console.log('complete: ',pointObject.output.fetchValues()[0].getCoords());
                _.each(pointers,function(point){
                    outputVals.push(point.getCoordsArray());
                });
                expect(outputVals).toEqual([[1,2,4],[2,4,8]]);
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
                expect(pointComponent.output.isNull()).toBe(true);
            });
            it("Returns an array of xyz arrays fetchCoordinates() is called",function(){});
            it("Returns an array of output pointers when fetchPointers() is called",function(){});
        })
    }];
});
