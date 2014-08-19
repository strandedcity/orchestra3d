// Test routine:
// 1) Create 3 JS arrays 'x', 'y', and 'z' with 2 integer entries each. Turn them into C arrays.
// 2) Each array should be wrapped in an "output" object to simulate its being from a "number" component
// 3) Register all three outputs as inputs for a "point" component
// 4) Trigger "updated" event on one of these outputs
//
// Expected Result: 2 SISLPoints are created. A single array is returned, wrapped in an "output" object,
// which should contain pointers to objects stored in C memory. Verify that the two c objects return appropriate
// values for x, y, z when interrogated.

var Test = {};
Test.Components = {};

Test.Components.PointFromNumbers = function(){
    var outputX = new Ant.Output({type: 'number'}),
        outputY = new Ant.Output({type: 'number'}),
        outputZ = new Ant.Output({type: 'number'});

    outputX.assignValues([1,2]);
    outputY.assignValues([2,4]);
    outputZ.assignValues([4,8]);

    // TODO: Verify arrays are copied into Emscripten Heap, and that each output contains a corresponding pointer

    var pointObject = new Ant.PointComponent();
    pointObject.assignInput("X",outputX);
    pointObject.assignInput("Y",outputY);
    pointObject.assignInput("Z",outputZ);

    pointObject.recalculate();
    console.log('calculation result: ',pointObject.output.fetchValues());
};

Test.Components.PointFromNumbers();