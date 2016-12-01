define(["dataFlow/dataTree","dataFlow/dataFlow_loader","dataFlow/dataMatcher"],function(DataTree,dataFlow,DataMatcher){
    /*
        THE TESTS IN THIS FILE ARE INTENDED TO MIMIC GRASSHOPPER'S DATA-MATCHING BEHAVIOR PERFECTLY
        TO SEE THE PARALLEL GRASSHOPPER RESULTS, SEE /dataFlow/ghx/dataMatcherTests.ghx
     */

    return ["DataMatcher",function(){
        var outputs;

        function createNumberOutputWithValuesAtPaths(values){
            // values should be an array of objects:
            // [
            //     {data: [data], path: [path]},
            //     {data: [data], path: [path]}
            //     ...
            // ]
            var t = new DataTree();
            _.each(values,function(val){
                t.setDataAtPath(val.data,val.path);
            })

            var n = new dataFlow.components.number.NumberComponent();
            n.getInput("N").assignPersistedData(t);
            return n.getOutput();
        }

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
            A = createNumberOutputWithValuesAtPaths([
                {data: [0.1], path: [0]},
                {data: [0.11], path: [1]}
            ]);

            // B -- should act as "master" list though it doesn't matter in this case
            B = createNumberOutputWithValuesAtPaths([
                {data: [1], path: [0,0]},
                {data: [2], path: [0,1]}
            ]);

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
            var A = createNumberOutputWithValuesAtPaths([
                {data: [0.1], path: [0]},
                {data: [0.11], path: [1]},
                {data: [0.111], path: [2]}
            ]),

            // B -- should act as "master" list though it doesn't matter in this case
            B = createNumberOutputWithValuesAtPaths([
                {data: [1], path: [0,0]},
                {data: [2], path: [0,1]}
            ]);

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
            var A = createNumberOutputWithValuesAtPaths([
                {data: [0.1,0.11,0.111], path: [0]}
            ]),
            B = createNumberOutputWithValuesAtPaths([
                {data: [1,2,3,4,5], path: [0]}
            ]);

            // Calculate result tree
            var calculatedResult = DataMatcher([A,B],function(a,b){
                return a * b;
            }).tree;

            // These expectations are based on a 1:1 comparison with grasshopper's results.
            // The test grasshopper file will be included in the repo for reference.
            expect(calculatedResult.dataAtPath([0],false)).toEqual([0.1, 0.22, 0.333, 0.444, 0.555 ]);
        });
        it("Matches three trees with no branches",function(){
            var A = createNumberOutputWithValuesAtPaths([
                {data: [0.1,0.11,0.111], path: [0]}
            ]),
            B = createNumberOutputWithValuesAtPaths([
                {data: [1,2], path: [0]}
            ]),
            C = createNumberOutputWithValuesAtPaths([
                {data: [1000,2000,3000,4000,5000], path: [0]} // C is master
            ]);

            // Calculate result tree
            var calculatedResult = DataMatcher([A,B,C],function(a,b,c){
                return a * b + c;
            }).tree;

            // These expectations are based on a 1:1 comparison with grasshopper's results.
            // The test grasshopper file will be included in the repo for reference.
            expect(calculatedResult.dataAtPath([0],false)).toEqual([1000.1, 2000.22, 3000.222, 4000.222, 5000.222 ]);
        });
        it("Matches two trees with non-matching branch levels",function(){
            var A = createNumberOutputWithValuesAtPaths([
                {data: [0.1], path: [0]},
                {data: [0.11], path: [1]},
                {data: [0.111], path: [2]}
            ]),
            B = createNumberOutputWithValuesAtPaths([
                {data: [1,4], path: [0,0,0]},
                {data: [2,5], path: [0,1,0]}
            ]);

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
            var A = createNumberOutputWithValuesAtPaths([
                {data: [0.1], path: [0]},
                {data: [0.11], path: [1]},
                {data: [0.111], path: [2]}
            ]),
            B = createNumberOutputWithValuesAtPaths([
                {data: [1], path: [0,0]},
                {data: [2], path: [0,1]}
            ]),
            C = createNumberOutputWithValuesAtPaths([
                {data: [1000,2000,3000], path: [0,0,0,0]} // C is master
            ]);

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
