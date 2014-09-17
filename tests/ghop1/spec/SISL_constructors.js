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
                });
                it("Calculates accurate length for straight line defined by THREE points",function(){
                    var start = new Geo.Point(1,1,0),
                        mid = new Geo.Point(2,2,0),
                        end = new Geo.Point(3,3,0),
                        curve = new Geo.Curve([start,mid,end],1,false);

                    // The length measurement for a straight line should be exact
                    expect(curve.getLength()).toEqual(2* Math.sqrt(2));
                });
                it("Curve length differs based on curve degree",function(){
                    var start = new Geo.Point(1,1,0),
                        mid = new Geo.Point(1.5,2.5,0),
                        end = new Geo.Point(3,3,0),
                        curve = new Geo.Curve([start,mid,end],1,false),
                        curve2 = new Geo.Curve([start,mid,end],2,false);

                    // If the two curves are really different, their lengths should differ.
                    // Degree 1 curve should be longer since it describes a control polygon surrounding a curve.
                    expect(curve.getLength()).not.toEqual(curve2.getLength());
                    expect(curve.getLength()).toBeGreaterThan(curve2.getLength());
                });
                it("Throws an error when curve degree is not smaller than the number of control points",function(){
                    var p0 = new Geo.Point(1,1,0),
                        p1 = new Geo.Point(2,2,0),
                        p2 = new Geo.Point(3,3,0),
                        p3 = new Geo.Point(4,4,0),
                        p4 = new Geo.Point(5,5,0),
                        p5 = new Geo.Point(6,6,0);

                    // Verify both positive and negative cases for a variety of point and degree combos:
                    expect(function(){new Geo.Curve([p0,p1,p2],3,false)}).toThrowError("Curve degree must be smaller than the number of control points");
                    expect(function(){new Geo.Curve([p0,p1,p2,p3],3,false)}).not.toThrowError("Curve degree must be smaller than the number of control points");
                    expect(function(){new Geo.Curve([p0,p1,p2,p3,p4],3,false)}).not.toThrowError("Curve degree must be smaller than the number of control points");
                    expect(function(){new Geo.Curve([p0,p1],2,false)}).toThrowError("Curve degree must be smaller than the number of control points");
                    expect(function(){new Geo.Curve([p0,p1,p2,p3,p4,p5],5,false)}).not.toThrowError("Curve degree must be smaller than the number of control points");
                    expect(function(){new Geo.Curve([p0,p1,p2,p3,p4,p5],6,false)}).toThrowError("Curve degree must be smaller than the number of control points");
                    expect(function(){new Geo.Curve([p0,p1,p2,p3,p4,p5],3,false)}).not.toThrowError("Curve degree must be smaller than the number of control points");
                });
                it("Evaluates the correct position and tangent vector at the midpoint of a straight line",function(){
                    var p0 = new Geo.Point(1,1,0),
                        p1 = new Geo.Point(3,3,0),
                        line = new Geo.Curve([p0,p1],1,false);

                    // results
                    var tangentVect = line.tangentAt(0.5),
                        midPoint = line.positionAt(0.5);

                    // midpoint should be where we think it should be
                    expect(midPoint).not.toBeUndefined();
                    expect(midPoint.constructor.name).toEqual("GeoPoint");
                    expect(midPoint.getCoordsArray()).toEqual([2,2,0]);

                    // tangent vect should just be (1,1,0);
                    expect(tangentVect).not.toBeUndefined();
                    expect(tangentVect.constructor.name).toEqual("GeoVect");
                    expect(tangentVect.getCoordsArray()).toEqual([1,1,0]);
                });
                it("Evaluates the correct position and tangent vector for a degree 3 curve");
            });
        }
    ]
});
