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
            describe("GeoVect",function(){
                it ("Returns a COPY of the vector when normalized");
                it ("Returns a correctly normalized vector",function(){
                    var v0 = new Geo.Vect(2,2,0);
                    var normalized = v0.getNormalVectArray();

                    expect(normalized[0]).toBeCloseTo(Math.sqrt(2)/2);
                    expect(normalized[1]).toBeCloseTo(Math.sqrt(2)/2);
                    expect(normalized[2]).toBeCloseTo(0);
                });
            });
            describe("GeoCurve",function(){
                it("Throws error when passed generic arrays for coordinates",function(){
                    expect(function(){
                        new Geo.Curve([[1,3,4],[1,5,6],[6,3,0]],2,false);
                    }).toThrowError("Controlpoints must be an array of at least 2 Geo.Point objects");
                });
                it("Throws error when passed a single Geo.Point",function(){
                    expect(function(){
                        new Geo.Curve([new Geo.Point(2,2,0)],2,false);
                    }).toThrowError("Controlpoints must be an array of at least 2 Geo.Point objects");
                });
                it("Throws error when passed a non-integer curve degree",function(){
                    var start = new Geo.Point(1,1,0),
                        mid = new Geo.Point(2,2,0),
                        end = new Geo.Point(3,3,0);
                    expect(function(){
                        new Geo.Curve([start,mid,end],1.32,false);
                    }).toThrowError("Curve degree must be an integer");
                    expect(function(){
                        new Geo.Curve([start,mid,end],false,false);
                    }).toThrowError("Curve degree must be an integer");
                    expect(function(){
                        new Geo.Curve([start,mid,end],"2",false);
                    }).toThrowError("Curve degree must be an integer");
                });
                it("Throws error when passed a string or number for periodicity",function(){
                    var start = new Geo.Point(1,1,0),
                        mid = new Geo.Point(2,2,0),
                        end = new Geo.Point(3,3,0);
                    expect(function(){
                        new Geo.Curve([start,mid,end],1,1);
                    }).toThrowError("Periodic must be a boolean");
                    expect(function(){
                        new Geo.Curve([start,mid,end],1,0);
                    }).toThrowError("Periodic must be a boolean");
                    expect(function(){
                        new Geo.Curve([start,mid,end],1,false);
                    }).not.toThrowError();
                    expect(function(){
                        new Geo.Curve([start,mid,end],1,true);
                    }).not.toThrowError();
                });
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
                    var tangentVect = line.getTangentAt(0.5),
                        midPoint = line.getPositionAt(0.5);

                    // midpoint should be where we think it should be
                    expect(midPoint).not.toBeUndefined();
                    expect(midPoint.constructor.name).toEqual("GeoPoint");
                    expect(midPoint.getCoordsArray()).toEqual([2,2,0]);

                    // tangent vect should be a 2d vector @45 degrees: (sqrt(2)/2,sqrt(2)/2,0);
                    // In the case of this particular line, its magnitude should be
                    expect(tangentVect).not.toBeUndefined();
                    expect(tangentVect.constructor.name).toEqual("GeoVect");
                    expect(tangentVect.getCoordsArray()[0]).toEqual(tangentVect.getCoordsArray()[1]);
                    expect(tangentVect.getCoordsArray()[2]).toEqual(0);

                    // In this case, the actual magnitude of the vector is easy to know as well
                    expect(tangentVect.getCoordsArray()[0]).toEqual(2);
                    expect(tangentVect.getCoordsArray()[1]).toEqual(2);
                });
                it("Evaluates the correct position and tangent vector for a degree 3 curve",function(){
                    var start = new Geo.Point(1,1,0),
                        mid = new Geo.Point(1,5,0),
                        mid2 = new Geo.Point(3,5,0),
                        end = new Geo.Point(3,1,0),
                        curve = new Geo.Curve([start,mid,mid2,end],3,false);

                    for (var i=0; i<5; i+=0.5){
                        console.log(i+': ',curve.getPositionAt(i).getCoordsArray());
                    }

                    // at the top of a parabola-like curve (but degree 3), the tangent vector should point horizontally:
                    var normalTangent = curve.getTangentAt(0.5).getNormalVectArray();
                    expect(normalTangent[0]).toEqual(1);
                    expect(normalTangent[1]).toEqual(0);
                    expect(normalTangent[2]).toEqual(0);
                });
            });
        }
    ]
});
