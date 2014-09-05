define(["SISL"],function(Geo){
    return [
        "Wrapper Functions:",
        function(){
            it("Geo.Point Throws an error if passed an array of numbers",function(){
                expect(function(){new Geo.Point([3.1415,100000,-200])}).toThrowError("Must pass 3 numbers to create a Point");
            });
            it("Geo.Point Throws an error if passed no parameters",function(){
                expect(function(){new Geo.Point()}).toThrowError("Must pass 3 numbers to create a Point");
            });
            it("Geo.Point Constructor Accepts 3 numbers, and stores a _pointer property",function(){
                var point = new Geo.Point(3.1415,100000,-200);
                expect(point._pointer).toBeDefined();
                expect(typeof point._pointer).toEqual("number");
            });
            it("Geo.Point Returns its pointer using 'getPointer",function(){
                var point = new Geo.Point(3.1415,100000,-200);
                expect(point._pointer).toBeDefined();
                expect(typeof point._pointer).toEqual("number");
                expect(point._pointer).toEqual(point.getPointer());
            });
            it("Geo.Point Returns its coordinates using 'getCoordsArray'",function(){
                var point = new Geo.Point(3.1415,100000,-200);
                var coordsArray = point.getCoordsArray();
                expect(coordsArray[0]).toBeCloseTo(3.1415);
                expect(coordsArray[1]).toEqual(100000);
                expect(coordsArray[2]).toEqual(-200);
            });
            it("Geo.Point Returns a float32Array object using 'getCoords'",function(){
                var point = new Geo.Point(3.1415,100000,-200);
                var float32arr = point.getCoords();
                expect(float32arr).toBeDefined();
                expect(typeof float32arr).toEqual("object");
                expect(typeof float32arr.byteLength).toEqual("number");
                expect(float32arr.byteLength).toEqual(3 * Float32Array.BYTES_PER_ELEMENT);
            });
        }
    ]
});
