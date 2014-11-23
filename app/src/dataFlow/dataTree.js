define([
    "underscore"
],function(_){
    // A custom data tree structure for dataFlow, designed to mimick grasshopper's data handling.
    // The tree itself draws inspiration from this project: http://jnuno.com/tree-model-js/
    // The tree-traversal and transform functions draw on underscore contrib: http://documentcloud.github.io/underscore-contrib/#iterators.tree

    /* Things I need to do:

    Collect each item at the lowest level of the tree, and create a new tree with each of those items in a top-level node

    Provide algorithms that take two (or more) trees, supplying pairs (or groups) of elements that should have calculations applied --> these can be developed on the nodes

    Map paths using DICTIONARIES so there can be blank paths

    Allow trees to be transformed based on lexical re-mappings (ie, like the path mapper). DataTree.remapPath("{A;B}(i):{B;A}(i)") --> returns copy of data tree, remapped

    Question: is it data OR path, or can a node have data AND a path? --> Node can have both

    getNodeAtPath


     */

    function DataTree(){
        // The tree is just a node, but it's a little special:
        // 1) It's the only one that's exposed to outside this module, which means it's impossible to create a "stranded" node with no connection to the tree
        // 2) It's the only one with no parents
        // 3) It has tree-traversal and path-mapping "class methods" that allow the creation of new, re-arranged trees

        this.pathId = 0;
    }
    DataTree.prototype = new Node();
    DataTree.prototype.constructor = DataTree;

    DataTree.prototype.recurseTree = function(iterator){
        // walks the tree, calling iterator for each node. Iterator is a function that takes DATA (an array) and an optional PATH string.
        // PATH strings will match the node's complete tree path, DATA will represent the data on that node.

        if (typeof iterator !== "function") {throw new Error("recurseTree must be called with an iterator: function(data[,path string])");}

        (function recurseChildren(node){
            // if data, call the iterator
            if (!_.isEmpty(node.data)) {
                iterator(node.data, node.getPath());
            }
            // if children, recurse a level deeper
            var childKeys = _.keys(node.children);
            if (childKeys.length > 0) {
                _.each(childKeys,function(childName){
                    recurseChildren(node.children[childName]);
                });
            }
        })(this);
    };



    function Node(data,parent){
        var defined = !_.isUndefined(data), array = _.isArray(data);
        if (defined && !array) {
            throw new Error("Tried to assign a non-array to a Node in a Data Tree");
        }

        if (!defined) {data = [];}
        this.data = data;
        //this.children = []; // no! PATHS ARE STORED IN DICTIONARIES, and parents define children's keys
        this.children = {};

        this.parent = parent;
        //this.pathId = parent.getPathForChildNode(this); // node won't be added yet. The parent must assign this property

    }

    Node.prototype.isRoot = function () {
        return _.isUndefined(this.parent);
    };

    Node.prototype.addChildAtPath = function(data, pathArray){
        // Function assumes you set one list of data to a particular path, relative to this node.
        // All branches along the path, prior to the end, will be data-free
        if (!_.isArray(pathArray)) {throw new Error("must pass pathArray to addChildAtPath");}

        pathArray.reverse();
        _.each(pathArray,function(element){
            if (parseInt(element) !== element) {throw new Error("Encountered non-integer array path: " + element);}
        });

        // recursively add nodes to arrive at point where data belongs
        (function addNode(node,pathArray){
            var nodedata, path = pathArray.pop();
            if (pathArray.length === 0) nodedata = data;
            var newNode = node.children[path] || new Node(nodedata,node); // don't overwrite nodes if they already exist
            node.children[path] = newNode;
            newNode.pathId = path;
            if (pathArray.length > 0) {
                addNode(newNode,pathArray);
            }
        })(this,pathArray);
    };

    Node.prototype.getPathForChildNode = function(childNode){
        var that = this;
        _.each(_.keys(this.children),function(childPath){
            if (that.children[childPath] === childNode) {
                return childPath;
            }
        })
    };
    Node.prototype.getPath = function(){
        var path = [];
        (function addToPath(node) {
            path.push(node.pathId);
            if (!node.isRoot()) {
                addToPath(node.parent);
            }
        })(this);
        return path.reverse();
    };


    return DataTree;

});
