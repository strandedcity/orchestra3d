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
                it("Returns getLength() === sqrt(2) for a straight 1-unit line",function(){
                    var start = new Geo.Point(1,1,0),
                        end = new Geo.Point(2,2,0),
                        curve = new Geo.Curve([start,end],1,false);

                    // The length measurement for a straight line should be exact
                    expect(curve.getLength()).toEqual(Math.sqrt(2));
                })
                it("Calculates accurate length for straight line defined by THREE points",function(){
                    var start = new Geo.Point(1,1,0),
                        mid = new Geo.Point(2,2,0),
                        end = new Geo.Point(3,3,0),
                        curve = new Geo.Curve([start,mid,end],1,false);

                    // The length measurement for a straight line should be exact
                    expect(curve.getLength()).toEqual(2* Math.sqrt(2));
                })
            });
        }
    ]
});
