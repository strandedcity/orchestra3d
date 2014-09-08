define(["SISL"],function(Geo){
    return [
        "Wrapper Functions -->",
        function(){
            describe("GeoPoint",function(){
                it("Throws an error if passed an array of numbers",function(){
                    expect(function(){new Geo.Point([3.1415,100000,-200])}).toThrowError("Must pass 3 numbers to create a Point");
                });
                it("Throws an error if passed no parameters",function(){
                    expect(function(){new Geo.Point()}).toThrowError("Must pass 3 numbers to create a Point");
                });
                it("Constructor Accepts 3 numbers, and stores a _pointer property",function(){
                    var point = new Geo.Point(3.1415,100000,-200);
                    expect(point._pointer).toBeDefined();
                    expect(typeof point._pointer).toEqual("number");
                });
                it("Returns its pointer using 'getPointer",function(){
                    var point = new Geo.Point(3.1415,100000,-200);
                    expect(point._pointer).toBeDefined();
                    expect(typeof point._pointer).toEqual("number");
                    expect(point._pointer).toEqual(point.getPointer());
                });
                it("Returns its coordinates using 'getCoordsArray'",function(){
                    var point = new Geo.Point(3.1415,100000,-200);
                    var coordsArray = point.getCoordsArray();
                    expect(coordsArray[0]).toBeCloseTo(3.1415);
                    expect(coordsArray[1]).toEqual(100000);
                    expect(coordsArray[2]).toEqual(-200);
                });
                it("Returns a float32Array object using 'getCoords'",function(){
                    var point = new Geo.Point(3.1415,100000,-200);
                    var float32arr = point.getCoords();
                    expect(float32arr).toBeDefined();
                    expect(typeof float32arr).toEqual("object");
                    expect(typeof float32arr.byteLength).toEqual("number");
                    expect(float32arr.byteLength).toEqual(3 * Float32Array.BYTES_PER_ELEMENT);
                });
            });
            describe("GeoCurve",function(){
                it("Throws error when passed generic objects for coordinates");
                it("Throws error when passed a single GeoPoint not inside an array");
                it("Throws error when passed a non-integer curve degree");
                it("Throws error when passed a string or number for periodicity ");
                it("Returns a pointer using 'getPointer' after being passed proper parameters",function(){
                    var start = new Geo.Point(0,1,2),
                        end = new Geo.Point(3,4,5),
                        curve = new Geo.Curve([start,end],1,false);

                    expect(curve.getPointer()).not.toEqual(0);
                    expect(typeof curve.getPointer()).toEqual("number");
                });
                it("Returns getLength() ~~ sqrt(2) when passed (0,0) and (1,1), degree 1, non-periodic")
            });
        }
    ]
});
