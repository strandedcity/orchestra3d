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
        it("newCurve",function(){
            // SISLCurve *newCurve (vertex_count, curve_order, *knotvector, *vertices, ikind, dimension, icopy)
            // ikind: 1=polynomial b-spline, 2=rational b-spline, 3=polynomial bezier, 4=rational bezier
            // icopy: 0=Set pointer to input arrays, 1=Copy input arrays, 2=Set pointer and remember to free arrays.
            var ptr = Module.cwrap('newCurve','number',['number','number','number','number','number','number','number']);
            expect(typeof ptr).toBe("function");
        });
    }];
});
