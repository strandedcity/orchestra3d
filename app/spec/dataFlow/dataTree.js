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
        it("Remaps a tree given path mapping function [A,B,C] --> [A,C,B]",function(){
            var tree = new DataTree();
            var d1 = [1,2,3,4], d2 = [5,6,7,8];
            var p1 = [2,0], p2 = [0,3]; // these are relative to the tree, so the full path is [0,2,0], [0,0,3], etc
            tree.addChildAtPath(d1,p1);
            tree.addChildAtPath(d2,p2);

            var remapped = tree.remappedTree("{A;B;C}","{A;C;B}");
            //expect(remapped.getChildAtPath([0,0,2]).data).toEqual(d1); // these lines work! HOWEVER, they are wrong.
            //expect(remapped.getChildAtPath([0,3,0]).data).toEqual(d2);
            expect(remapped.getChildAtPath(p1.reverse()).data).toEqual(d1);
            expect(remapped.getChildAtPath(p2.reverse()).data).toEqual(d2);
        });
        it("Remaps a tree given path mapping function [A,B](i) --> [B,i](A)",function(){

        });
    }];
});
