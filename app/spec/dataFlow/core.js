define(["dataFlow/dataFlow_loader"],function(dataFlow){
    return ["Core -->",function(){
        describe("Output",function(){
            var outputX;
            beforeEach(function(){
                outputX = new dataFlow.components.number.NumberComponent();
            });

            it("Instantiates a new 'number' output object",function(){
                expect(typeof outputX.getOutput()).toEqual("object");
                expect(outputX.getOutput().type).toEqual(dataFlow.OUTPUT_TYPES.NUMBER);
            });
            it("Throws an error when not specifying type",function(){
                expect(function(){new dataFlow.Output()}).toThrow(new Error("No type specified for Output"));
            });
            it("Stores an array of Integers",function(){
                outputX.getInput("N").assignPersistedData([1,2]);
                expect(outputX.getOutput().getTree().dataAtPath([0])).toEqual([1,2]);
            });
            it("Stores an array of floats",function(){
                outputX.getInput("N").assignPersistedData([1.1111,2.2222]);
                expect(outputX.getOutput().getTree().dataAtPath([0])).toEqual([1.1111,2.2222]);
            });
            it("Has null tree if no values assigned",function(){
                expect(outputX.getOutput().getTree().isEmpty()).toEqual(true);
            });
            it("Re-uses C-memory when new values are assigned (pointer stays the same)");
        });
        describe("Component",function(){
            it("Should have tests");
        });
    }];
});
