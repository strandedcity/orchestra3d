define(["SISL"],function(SISL){
    describe("SISL Compiled JS Functions:",function(){
        it("newPoint",function(){
            var newPoint = Module.cwrap('newPoint','number',['number','number','number']);
            expect(typeof newPoint).toBe("function");
        });
    });
});
