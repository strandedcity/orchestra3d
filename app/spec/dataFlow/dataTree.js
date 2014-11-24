define(["dataFlow/dataTree"],function(DataTree){
    return ["DataTree",function(){
        it("Has an empty array for data by default",function(){
            var tree = new DataTree();
            expect(tree.data).toEqual([]);
        });
        it("Stores data at the root level when instantiated with an array",function(){
            var data = [1,2,3,4];
            var tree = new DataTree(data);
            expect(tree.data).toEqual(data);
        });
        it("Does NOT store data at the root level when a path is specified",function(){
            var data = [1,2,3,4];
            var tree = new DataTree();
            tree.addChildAtPath(data,[0,1]);
            expect(tree.data).toEqual([]);
        });
        it("Retrieves data from branch at specified path",function(){
            var data = [1,2,3,4], path = [2,1];
            var tree = new DataTree();
            tree.addChildAtPath(data,path);
            var node = tree.getChildAtPath(path);
            expect(node.data).toEqual(data);
        });
        it("Does not mutate the passed-in path to assign and then access a branch by path", function(){
            var data = [1,2,3,4], path = [2,1], pathCopy = path.slice(0);
            var tree = new DataTree();
            tree.addChildAtPath(data,path);
            tree.getChildAtPath(path);
            expect(path).toEqual(pathCopy);
        });
        it("Treats instances separately",function(){
            // test case for a weird bug. Somehow the datatrees are all apparently sharing the same object??
            var tree = new DataTree([1,1]);
            tree.addChildAtPath([2,3],[0,1]);
            tree.addChildAtPath([5,8],[0,2]);
            tree.addChildAtPath([13,21],[0,2,0]);

            var interference = new DataTree();
            interference.addChildAtPath([99,9,999],[0,0,2,0]);

            var flat = tree.flattenedTree();
            expect(flat.data).toEqual([1,1,2,3,5,8,13,21]);
        });
        it("Flattens a simple tree",function(){
            var tree = new DataTree([1,1]);
            tree.addChildAtPath([2,3],[0,1]);
            tree.addChildAtPath([5,8],[0,2]);
            tree.addChildAtPath([13,21],[0,2,0]);

            var flat = tree.flattenedTree();
            expect(flat.data).toEqual([1,1,2,3,5,8,13,21]);
        });

        it("Flattens a complex tree, defined out of order",function(){
            var tree = new DataTree();
            tree.addChildAtPath([],[0,5,2]);
            tree.addChildAtPath([13,21,34],[0,5,2,0,0]);
            tree.addChildAtPath([1,2],[0,1]);
            tree.addChildAtPath([1],[0,0]);
            tree.addChildAtPath([3,5,8],[0,5,1]);

            var flat = tree.flattenedTree();
            expect(flat.data).toEqual([1,1,2,3,5,8,13,21,34]);
        });
        it("Remaps a tree given path mapping function {A;B;C} --> {A;C;B}",function(){
            var tree = new DataTree();
            var d1 = [1,2,3,4], d2 = [5,6,7,8];
            var p1 = [2,0], p2 = [0,3]; // these are relative to the tree, so the full path is [0,2,0], [0,0,3], etc
            tree.addChildAtPath(d1,p1);
            tree.addChildAtPath(d2,p2);

            var remapped = tree.remappedTree("{A;B;C}","{A;C;B}");
            expect(remapped.getChildAtPath(p1.reverse()).data).toEqual(d1); // using .reverse() just because that matches the mapping here
            expect(remapped.getChildAtPath(p2.reverse()).data).toEqual(d2);
        });
        it("Remaps a tree given path mapping function {A;B}(i)-->{A;i}(B) with FULL ARRAYS",function(){
            var tree = new DataTree();
            var d0 = [0,0,0,0], d1 = [1,1,1,1], d2 = [2,2,2,2], d3 = [3,3,3,3], pivoted = [0,1,2,3];
            var p0 = [0], p1 = [1], p2 = [2], p3 = [3]; // these are relative to the tree, so the full path includes [0] at the beginning
            tree.addChildAtPath(d0,p0);
            tree.addChildAtPath(d1,p1);
            tree.addChildAtPath(d2,p2);
            tree.addChildAtPath(d3,p3);

            var remapped = tree.remappedTree("{A;B}(i)","{A;i}(B)");
            expect(remapped.getChildAtPath(p0).data).toEqual(pivoted);
            expect(remapped.getChildAtPath(p1).data).toEqual(pivoted);
            expect(remapped.getChildAtPath(p2).data).toEqual(pivoted);
            expect(remapped.getChildAtPath(p3).data).toEqual(pivoted);
        });
        it("Remaps a tree given path mapping function {A;B}(i)-->{A;i}(B) with NON-FULL ARRAYS",function(){
            // During development of this test case, it became clear that two test cases were relevant.
            // When the destination data arrays are full, ie, they have data items at every index, they pivot correctly in the above test
            // Here, however, by omitting the "0" entry for the pivoted arrays (by starting with [1,1,1,1], the pivoted arrays end up with
            // empty first elements that need to be filtered
            var tree = new DataTree();
            var d1 = [1,1,1,1], d2 = [2,2,2,2], d3 = [3,3,3,3], d4 = [4,4,4,4], pivoted = [1,2,3,4];
            var p1 = [1], p2 = [2], p3 = [3], p4 = [4]; // these are relative to the tree, so the full path is [0,2,0], [0,0,3], etc
            tree.addChildAtPath(d1,p1);
            tree.addChildAtPath(d2,p2);
            tree.addChildAtPath(d3,p3);
            tree.addChildAtPath(d4,p4);

            var remapped = tree.remappedTree("{A;B}(i)","{A;i}(B)");
            expect(remapped.getChildAtPath([0]).getFilteredData()).toEqual(pivoted);
            expect(remapped.getChildAtPath([1]).getFilteredData()).toEqual(pivoted);
            expect(remapped.getChildAtPath([2]).getFilteredData()).toEqual(pivoted);
            expect(remapped.getChildAtPath([3]).getFilteredData()).toEqual(pivoted);
        });
        it("Grafts a simple tree",function(){
            var inputData = [4,5];
            var tree = new DataTree(inputData);
            var grafted = tree.graftedTree();

            // Make sure the tree is as we expect it going in:
            expect(tree.data).toEqual(inputData);
            //tree.recurseTree(function(data,node){
            //    console.log('path: ',node.getPath(),'      data: ',data);
            //});

            // "graft" uses the index of each item in the data array to generate a new sub-branch with that name.
            // 1, the item at index 0 of the input array, should end up at 0,0
            _.each(inputData,function(val,index){
                expect(grafted.getChildAtPath([index]).data).toEqual([val]);
            });
            //grafted.recurseTree(function(data,node){
            //    console.log('path: ',node.getPath(),'      data: ',data);
            //});
        });
        it("Grafts a complex tree");
    }];
});
