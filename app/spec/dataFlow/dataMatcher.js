define(["dataFlow/dataTree","dataFlow/core","dataFlow/dataMatcher"],function(DataTree,dataFlow,DataMatcher){
    /*
        THE TESTS IN THIS FILE ARE INTENDED TO MIMIC GRASSHOPPER'S DATA-MATCHING BEHAVIOR PERFECTLY
        TO SEE THE PARALLEL GRASSHOPPER RESULTS, SEE /dataFlow/ghx/dataMatcherTests.ghx
     */

    return ["DataMatcher",function(){
        var outputs;

        beforeEach(function(){
            // let's have some trees to work with. Because DataMatcher is a "class" specifically designed to mimic grasshopper's
            // handling of list-alignments. I've attempted to separate out the most odd-seeming pieces of grasshoppers behavior into
            // DataMatcher alone, leaving DataTree a perfectly useful, and generic, data-tree object.

            // The tests below will run simple calculations across output objects to verify that the lists of data they contain match up correctly.
            // Numbers make it easy to tell which list items are being combined.
            outputs = [];
            for (var i=0; i<3; i++) {outputs[i] = new dataFlow.Output({type: dataFlow.OUTPUT_TYPES.NUMBER, shortName: "N"});}
        });

        it("Selects the correct master list when there are equal numbers of branches, but a deeper path in one case",function(){
            var A = outputs[0], B = outputs[1];
            A.assignValues([0.1],[0]);
            A.assignValues([0.11],[1]);

            // B -- should act as "master" list though it doesn't matter in this case
            B.assignValues([1],[0,0]);
            B.assignValues([2],[0,1]);

            // Output C
            var calculatedResult = DataMatcher([A,B],function(a,b){
                return a * b;
            });

            expect(calculatedResult.masterInput.getTree().dataAtPath([0,0],false)).toEqual([1]);
            expect(calculatedResult.masterInput.getTree().dataAtPath([0,1],false)).toEqual([2]);
            expect(calculatedResult.tree.dataAtPath([0,0],false)).toEqual([0.1]);
            expect(calculatedResult.tree.dataAtPath([0,1],false)).toEqual([0.22]);
        });
        it("Selects the correct master list when there more branches on the non-master path, but deeper branches on the master path",function(){
            var A = outputs[0], B = outputs[1];
            A.assignValues([0.1],[0]);
            A.assignValues([0.11],[1]);
            A.assignValues([0.111],[2]);

            // B -- should act as "master" list though it doesn't matter in this case
            B.assignValues([1],[0,0]);
            B.assignValues([2],[0,1]);

            // Output C
            var calculatedResult = DataMatcher([A,B],function(a,b){
                return a * b;
            });

            expect(calculatedResult.masterInput.getTree().dataAtPath([0,0],false)).toEqual([1]);
            expect(calculatedResult.masterInput.getTree().dataAtPath([0,1],false)).toEqual([2]);
            expect(calculatedResult.tree.dataAtPath([0,0],false)).toEqual([0.1]);
            expect(calculatedResult.tree.dataAtPath([0,1],false)).toEqual([0.22]);
            expect(calculatedResult.tree.dataAtPath([0,2],false)).toEqual([0.222]);
        });
        it("Matches two trees with no branches",function(){
            var A = outputs[0], B = outputs[1];
            A.assignValues([0.1,0.11,0.111],[0]);
            B.assignValues([1,2,3,4,5],[0]);

            // Calculate result tree
            var calculatedResult = DataMatcher([A,B],function(a,b){
                return a * b;
            }).tree;

            // These expectations are based on a 1:1 comparison with grasshopper's results.
            // The test grasshopper file will be included in the repo for reference.
            expect(calculatedResult.dataAtPath([0],false)).toEqual([0.1, 0.22, 0.333, 0.444, 0.555 ]);
        });
        it("Matches three trees with no branches",function(){
            var A = outputs[0], B = outputs[1], C = outputs[2];
            A.assignValues([0.1,0.11,0.111],[0]);
            B.assignValues([1,2],[0]);
            C.assignValues([1000,2000,3000,4000,5000],[0]); // C is master

            // Calculate result tree
            var calculatedResult = DataMatcher([A,B,C],function(a,b,c){
                return a * b + c;
            }).tree;

            // These expectations are based on a 1:1 comparison with grasshopper's results.
            // The test grasshopper file will be included in the repo for reference.
            expect(calculatedResult.dataAtPath([0],false)).toEqual([1000.1, 2000.22, 3000.222, 4000.222, 5000.222 ]);
        });
        it("Matches two trees with non-matching branch levels",function(){
            var A = outputs[0], B = outputs[1];
            A.assignValues([0.1],[0]);
            A.assignValues([0.11],[1]);
            A.assignValues([0.111],[2]);

            B.assignValues([1,4],[0,0,0]);
            B.assignValues([2,5],[0,1,0]);

            // Calculate result tree
            var calculatedResult = DataMatcher([A,B],function(a,b){
                return a * b;
            }).tree;

            // These expectations are based on a 1:1 comparison with grasshopper's results.
            // The test grasshopper file will be included in the repo for reference.
            expect(calculatedResult.dataAtPath([0,0,0],false)).toEqual([  0.1,0.4 ]);
            expect(calculatedResult.dataAtPath([0,1,0],false)).toEqual([  0.22,0.55 ]);
            expect(calculatedResult.dataAtPath([0,1,1],false)).toEqual([  0.222,0.555  ]);
        });
        it("Matches three trees with non-matching branch levels",function(){
            var A = outputs[0], B = outputs[1], C = outputs[2];
            A.assignValues([0.1],[0]);
            A.assignValues([0.11],[1]);
            A.assignValues([0.111],[2]);

            B.assignValues([1],[0,0]);
            B.assignValues([2],[0,1]);

            C.assignValues([1000,2000,3000],[0,0,0,0]); // C is master

            // Calculate result tree
            var calculatedResult = DataMatcher([A,B,C],function(a,b,c){
                return a * b + c;
            }).tree;

            // These expectations are based on a 1:1 comparison with grasshopper's results.
            // The test grasshopper file will be included in the repo for reference.
            expect(calculatedResult.dataAtPath([0,0,0,0],false)).toEqual([  1000.1,   2000.1,     3000.1    ]);
            expect(calculatedResult.dataAtPath([0,0,0,1],false)).toEqual([  1000.22,  2000.22,    3000.22   ]);
            expect(calculatedResult.dataAtPath([0,0,0,2],false)).toEqual([  1000.222, 2000.222,   3000.222  ]);
        });

        it("Selects the correct master list when an 'as-list' path is deeper than an 'as-item' path");
    }];
});
