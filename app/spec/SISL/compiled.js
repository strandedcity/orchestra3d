define(["SISL/sisl_loader"],function(SISL){
    return ["Compiled JS Function Signatures:", function(){
        it("newPoint does NOT exist",function(){
            expect(function(){Module.cwrap('newPoint','number',['number','number','number']);}).toThrow();
        });
        it("pointCoords does NOT exist",function(){
            expect(function(){Module.cwrap('pointCoords','number',['number']);}).toThrow();
        });
        it("newCurve",function(){
            // SISLCurve *newCurve (vertex_count, curve_order, *knotvector, *vertices, ikind, dimension, icopy)
            // ikind: 1=polynomial b-spline, 2=rational b-spline, 3=polynomial bezier, 4=rational bezier
            // icopy: 0=Set pointer to input arrays, 1=Copy input arrays, 2=Set pointer and remember to free arrays.
            var ptr = Module.cwrap('newCurve','number',['number','number','number','number','number','number','number']);
            expect(typeof ptr).toBe("function");
        });
        it("freeCurve",function(){
            var freeCurve = Module.cwrap('freeCurve','number',['number']);
            expect(typeof freeCurve).toBe("function");
        });
        it("s1240 / curve length",function(){
            var s1240 = Module.cwrap('s1240','number',['number','number','number','number']);
            expect(typeof s1240).toBe("function");
        });
        it("s1227 / curve evaluation",function(){
            var s1227 = Module.cwrap('s1227','number',['number','number','number','number','number','number']);
            expect(typeof s1227).toBe("function");
        });
        it("s1303 / circle approximation",function(){
            var s1303 = Module.cwrap('s1303','number',['number','number','number','number','number','number','number','number']);
            expect(typeof s1303).toBe("function");
        });
    }];
});
