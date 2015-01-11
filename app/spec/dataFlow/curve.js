define(["dataFlow/dataFlow_loader","SISL/sisl_loader"],function(dataFlow,Geo){
    return ["CurveControlPointComponent",function(){
        var nx,ny,nz,degree,point,periodic,curve;

        beforeEach(function(){
            // "outputs" are actually inputs to the "point" component. They are outputs
            // in the sense that they are assumed to be emitted from a prior component.
            // Output objects are tested separately in DataFlow --> Core --> Output Objects
            nx = new dataFlow.Output({type: dataFlow.OUTPUT_TYPES.NUMBER, shortName: "N"});
            ny = new dataFlow.Output({type: dataFlow.OUTPUT_TYPES.NUMBER, shortName: "N"});
            nz = new dataFlow.Output({type: dataFlow.OUTPUT_TYPES.NUMBER, shortName: "N"});
            var d = new dataFlow.Output({type: dataFlow.OUTPUT_TYPES.NUMBER, shortName: "N"});

            nx.assignValues([0,0,0,0,0,0]);
            ny.assignValues([1,2,3,4,5,6]);
            nz.assignValues([2,4,6,8,10,12]);

            point = new dataFlow.components.point.PointComponent();
            point.assignInput("X",nx);
            point.assignInput("Y",ny);
            point.assignInput("Z",nz);

            degree = new dataFlow.components.number.NumberComponent();
            degree.assignInput("N",d);
            periodic = new dataFlow.components.boolean.BooleanFalseComponent();
            curve = new dataFlow.components.curve.CurveControlPointComponent();

            // wire it all up:
            curve.assignInput("P",periodic.getOutput());
            curve.assignInput("V",point.getOutput());
            curve.assignInput("D",degree.getOutput());
        });

        it("Creates a single Curve Object at Path [0] when hooked up to simple inputs",function(){
            var output = curve.getOutput("C").getTree().dataAtPath([0]);
            expect(output.length).toEqual(1);
            expect(output[0].constructor).toBe(Geo.Curve);
            expect(curve.getOutput("C").getTree().flattenedTree().dataAtPath([0])).toEqual(output);
        });
        it("Creates multiple Curves when two numbers are passed in",function(){
            degree.getOutput("N").assignValues([2,3],[0]);

            // get data AFTER recalculation occurs, the tree reference could change.
            var outData = curve.getOutput("C").getTree().dataAtPath([0]);
            expect(outData.length).toEqual(2);
            for (var i=0; i<outData.length; i++){
                expect(outData[i].constructor).toBe(Geo.Curve);
            }
            expect(curve.getOutput("C").getTree().flattenedTree().dataAtPath([0])).toEqual(outData);
        });
        it("Uses the correct path identifiers & creates correct number of curves when the 'Control Points' input is the deepest path (it is master)",function(){
            // When the LIST parameter is deeper than the others, we expect the output paths to inherit from the LIST path indices.
            //
            // COMPARE THIS BEHAVIOR TO THE EXAMPLE SCREENSHOT IN THE GHX FOLDER:
            // test_listParam_data_matching_1.png

            var pointList = point.getOutput().getTree().dataAtPath([0]).slice(0),
                pointList2 = pointList.slice(0),
                pointList3 = pointList.slice(0);
            point.getOutput().clearValues();
            point.getOutput().getTree().setDataAtPath([0,100],pointList);
            point.getOutput().getTree().setDataAtPath([0,101],pointList2);
            point.getOutput().getTree().setDataAtPath([0,102],pointList3);

            degree.getOutput().assignValues([3,4],[0]);

            var resultTree = curve.getOutput().getTree(),
                path0100 = resultTree.dataAtPath([0,100]),
                path0101 = resultTree.dataAtPath([0,101]),
                path0102 = resultTree.dataAtPath([0,102]),
                fullPaths = [path0100,path0101,path0102],
                currentPath;
            while (currentPath = fullPaths.shift()) {
                expect(currentPath.length).toEqual(2);
                expect(currentPath[0].constructor).toBe(Geo.Curve);
                expect(currentPath[1].constructor).toBe(Geo.Curve);
            }

            // guarantee total exactly 6 results
            expect(resultTree.flattenedTree().dataAtPath([0]).length).toEqual(6);
        });
        it("Uses the correct path identifiers & creates correct number of curves when the 'Control Points' input is tied for the deepest path (it is not master)",function(){
            // COMPARE THIS BEHAVIOR TO THE EXAMPLE SCREENSHOT IN THE GHX FOLDER:
            // test_listParam_data_matching_2.png

            var pointList = point.getOutput().getTree().dataAtPath([0]).slice(0),
                pointList2 = pointList.slice(0),
                pointList3 = pointList.slice(0);
            point.getOutput().clearValues();
            point.getOutput().getTree().setDataAtPath([0,100],pointList);
            point.getOutput().getTree().setDataAtPath([0,101],pointList2);
            point.getOutput().getTree().setDataAtPath([0,102],pointList3);

            degree.getOutput().assignValues([3],[0,10]);
            degree.getOutput().assignValues([4],[0,11]);

            var resultTree = curve.getOutput().getTree(),
                path010 = resultTree.dataAtPath([0,10]),
                path011 = resultTree.dataAtPath([0,11]),
                path012 = resultTree.dataAtPath([0,12]),
                fullPaths = [path010,path011,path012],
                currentPath;
            while (currentPath = fullPaths.shift()) {
                expect(currentPath.length).toEqual(1);
                expect(currentPath[0].constructor).toBe(Geo.Curve);
            }

            // guarantee total exactly 3 results
            expect(resultTree.flattenedTree().dataAtPath([0]).length).toEqual(3);
        });
        it("Uses the correct path identifiers & creates correct number of curves when the 'Control Points' input is not the deepest (it is not master)",function(){
            // COMPARE THIS BEHAVIOR TO THE EXAMPLE SCREENSHOT IN THE GHX FOLDER:
            // test_listParam_data_matching_3.png

            degree.getOutput().assignValues([3],[0,0]);
            degree.getOutput().assignValues([4],[0,1]);

            var resultTree = curve.getOutput().getTree(),
                path00 = resultTree.dataAtPath([0,0]),
                path01 = resultTree.dataAtPath([0,1]),
                fullPaths = [path00,path01],
                currentPath;
            while (currentPath = fullPaths.shift()) {
                expect(currentPath.length).toEqual(1);
                expect(currentPath[0].constructor).toBe(Geo.Curve);
            }

            // guarantee total exactly 2 results
            expect(resultTree.flattenedTree().dataAtPath([0]).length).toEqual(2);

        });
    }];
});
