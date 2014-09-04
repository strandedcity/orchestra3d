// Test routine:
// 1) Create 3 JS arrays 'x', 'y', and 'z' with 2 integer entries each. Turn them into C arrays.
// 2) Each array should be wrapped in an "output" object to simulate its being from a "number" component
// 3) Register all three outputs as inputs for a "point" component
// 4) Trigger "updated" event on one of these outputs
//
// Expected Result: 2 SISLPoints are created. A single array is returned, wrapped in an "output" object,
// which should contain pointers to objects stored in C memory. Verify that the two c objects return appropriate
// values for x, y, z when interrogated.

define(["dataFlow"],function(dataFlow){
    describe("Point From Numbers Component",function(){

        // "outputs" are actually inputs to the "point" component. They are outputs
        // in the sense that they are assumed to be emitted from a prior component.
        var outputX = new dataFlow.Output({type: 'number'}),
            outputY = new dataFlow.Output({type: 'number'}),
            outputZ = new dataFlow.Output({type: 'number'});

        outputX.assignValues([1,2]);
        outputY.assignValues([2,4]);
        outputZ.assignValues([4,8]);

        var pointObject = new dataFlow.PointComponent();

        it("Creates a point object",function(){
            expect(pointObject.constructor.name).toEqual("PointComponent");
        });

        pointObject.assignInput("X",outputX);
        pointObject.assignInput("Y",outputY);
        pointObject.assignInput("Z",outputZ);

        it("Assigns numerical inputs to the dataFlow Point object",function(){
            expect(pointObject.inputs["X"]).toEqual(outputX);
            expect(pointObject.inputs["Y"]).toEqual(outputY);
            expect(pointObject.inputs["Z"]).toEqual(outputZ);
        });

        it("Calls _recalculate() in the superclass when recalculating",function(){
            spyOn(pointObject, '_recalculate');
            pointObject.recalculate();
            expect(pointObject._recalculate).toHaveBeenCalled();
        });

        pointObject.recalculate();

        //console.warn("After recalculation, there's a lot of code here to read the values back out. These should move to a utility class somewhere, since they're going to be useful everywhere. PERHAPS MOVE ONTO THE POINT COMPONENT ITSELF!");
        //console.warn("USE MOCK OBJECTS. See http://www.htmlgoodies.com/html5/javascript/spy-on-javascript-methods-using-the-jasmine-testing-framework.html#fbid=OUGNUC05Zto");

        // pointObject.fetchValues() should provide access to the output's pointer list

        var pointers = pointObject.output.fetchValues();
        var outputVals = [];
        //console.log('complete: ',pointObject.output.fetchValues()[0].getCoords());
        _.each(pointers,function(point){
            // Get normal array for easy round-trip-to-emscripten verification.
            // This operation shouldn't be necessary in actual usage.
            // point.getCoords() produces a float32array that can be used directly for most purposes.
            var normalArray = Array.apply([],point.getCoords());
            outputVals.push(normalArray);
        });

        // Assert equal: outputVals === [[1,2,4],[2,4,8]]
        it("Creates an array of points with the correct xyz locations",function(){
            expect(outputVals).toEqual([[1,2,4],[2,4,8]]);
        });
    });
});