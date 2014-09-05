define(["SISL"],function(SISL){
    return ["Compiled JS Function Signatures:", function(){
        it("newPoint",function(){
            var newPoint = Module.cwrap('newPoint','number',['number','number','number']);
            expect(typeof newPoint).toBe("function");
        });
        it("pointCoords",function(){
            var coordsPtr = Module.cwrap('pointCoords','number',['number']);
            expect(typeof coordsPtr).toBe("function");
        });
    }];
});
