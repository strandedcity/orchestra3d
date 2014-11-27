define(["dataFlow/dataFlow_loader"],function(dataFlow){
    return ["Core -->",function(){
        describe("Output",function(){
            it("Instantiates a new 'number' output object",function(){
                var outputX = new dataFlow.OutputNumber();
                expect(typeof outputX).toEqual("object");
                expect(outputX.constructor.name).toEqual("OutputNumber");
                expect(outputX.type).toEqual("number");
            });
            it("Throws an error when not specifying type",function(){
                expect(function(){new dataFlow.Output()}).toThrow(new Error("No type specified for Output"));
            });
            it("Stores an array of Integers",function(){
                var outputX = new dataFlow.OutputNumber();
                outputX.assignValues([1,2]);
                expect(outputX.getTree().dataAtPath([0])).toEqual([1,2]);
            });
            it("Stores an array of floats",function(){
                var outputX = new dataFlow.OutputNumber();
                outputX.assignValues([1.1111,2.2222]);
                expect(outputX.getTree().dataAtPath([0])).toEqual([1.1111,2.2222]);
            });
            it("Has null tree if no values assigned",function(){
                var outputX = new dataFlow.OutputNumber();
                expect(outputX.getTree()).toBeNull();
            });
            it("Throws an error when asked to store an individual number",function(){
                expect(function(){
                    var outputX = new dataFlow.OutputNumber();
                    outputX.assignValues(1);
                }).toThrow(new Error("'Values' must be an array"));
            });
            it("Throws an error when passed values as parameters, rather than a single array",function(){
                expect(function(){
                    var outputX = new dataFlow.OutputNumber();
                    outputX.assignValues(1,2,3,4);
                }).toThrow(new Error("'Values' must be an array"));
            });
            it("Re-uses C-memory when new values are assigned (pointer stays the same)");
        });
        describe("Component",function(){
            it("Should have tests");
        });
    }];
});
