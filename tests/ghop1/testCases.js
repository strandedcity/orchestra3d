// Psuedocode

// Test point component creates array of 1 pointer from input 3 arrays of 1 number each
// Test that these 3 numbers can be extracted from the pointer when interrogated for x,y,z

// Test line from two points
// Input: 2 separate arrays, one pointer to a SISLPoint each
// Output: SISLCurve



// Test routine:
// 1) Create 3 JS arrays 'x', 'y', and 'z' with 2 integer entries each. Turn them into C arrays.
// 2) Each array should be wrapped in an "output" object to simulate its being from a "number" component
// 3) Register all three outputs as inputs for a "point" component
// 4) Trigger "updated" event on one of these outputs
//
// Expected Result: 2 SISLPoints are created. A single array is returned, wrapped in an "output" object,
// which should contain pointers to objects stored in C memory. Verify that the two c objects return appropriate
// values for x, y, z when interrogated.