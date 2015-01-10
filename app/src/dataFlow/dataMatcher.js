define([
        "underscore",
        "dataFlow/dataTree",
        "dataFlow/enums"
    ],function(_,DataTree,ENUMS){
        // See http://www.grasshopper3d.com/page/new-data-matching-in-0-9 for reference

        /*  The master parameter might not be the parameter with the most branches.
            It is therefore possible that we run out of defined paths before the component is done computing.
            If this happens, the last index of the last available path in the master parameter is incremented on each iteration:
            Input A = {0;0} {0;1} {0;2}
            Input B = {0;1;0}
            Output C = {0;1;0} {0;1;1} {0;1;2}
            A has a maximum path length of 2, B has a maximum path length of 3, B is therefore the master parameter.
            However we need three unique output paths since A provides three paths, so {0;1;1} and {0;1;2} are made up on the spot.
        */

        /* The DataMatcher doesn't really need any properties; it just returns a fully calculated output tree */
        var DataMatcher = function DataMatcher(inputs,calculationFunction){
            if (!_.isFunction(calculationFunction)) {throw new Error("DataMatcher requires a calculation function");}
            if (!_.isArray(inputs)) {throw new Error("DataMatcher expects an array of inputs");}

            // DataMatcher is really just meant to be used as a function, but in some cases it may
            // be useful to create an object and read some additional properties.
            var masterInput = identifyMasterInput(inputs);

            return {
                tree: createCorrespondingOutputTree(inputs,masterInput,calculationFunction),
                masterInput: masterInput
            };
        };

        // This function accepts an arbitrary list of DataTree objects, and finds the "master" tree amongst them
        function identifyMasterInput(inputs){
            // Longer path lengths win
            // "list" parameters have lower priority than "item" parameters
            // "tree" parameters are never master unless all params are trees
            var pathLengths = _.map(inputs,function(IOObject){
                if (!_.isNull(IOObject.getTree())) {
                    return IOObject.getTree().getMaxPathLength();
                }
                return 1;
            });
            var longestPath = _.max(pathLengths);
            var contenders = [];

            _.each(pathLengths,function(el,index){
                // TODO: If one input has tree access, it shouldn't be a contender unless all inputs have tree access
                if (el === longestPath) {
                    contenders.push(inputs[index]);
                }
            });

            // Only one list with the longest path? That's the master
            if (contenders.length === 1) return contenders[0];

            var itemTypeContenders = _.filter(contenders,function(input){
                return input.interpretAs === ENUMS.INTERPRET_AS.ITEM;
            });

            if (itemTypeContenders.length === 1) {
                // Huzzah! Only one "item" typed list with the maximum path length, it wins
                return itemTypeContenders[0];
            } else if (itemTypeContenders.length === 0) {
                // The longest list is NOT a list of item type. Check list-type contenders, then.
                var listTypeContenders = _.filter(contenders,function(input){
                    return input.interpretAs === ENUMS.INTERPRET_AS.LIST;
                });

                // gotcha! Just one list-type input
                if (listTypeContenders.length === 0) return contenders[0]; // TODO: Poorly defined behavior. No ITEM or LIST inputs found!
                if (listTypeContenders.length === 1) return listTypeContenders[0]; // Well defined: no ITEM type inputs, and just one LIST type
                return listTypeContenders[0]; // TODO: Poorly defined: multiple LIST type inputs with same path level?
            } else { // itemTypeContenders.length > 1
                // TODO: Poorly defined: multiple ITEM type inputs with same path level?
                return itemTypeContenders[0];
            }
        }

        function createCorrespondingOutputTree(inputs,masterInput,calculation){
            var outputTree = new DataTree();

            // Grasshopper matches lists the same way it matches list *items*, so yes, it's possible that a master
            // input path may match an output path exactly, but the contained data may not align.
            // Basically we print out the "used" paths in recursive order for each element, then go down the line
            // doing calculations for lists and then repeating the last list when one runs out.

            var flattenedNodeList = [];     // will contain lists OF OBJECTS corresponding to each node with data.
                                            // each object will know the path of the node it should go to

            function appendUsedDataPaths(input){
                var dataListForTree = [],
                    inputTree = input.getTree().copy();

                if (input.interpretAs === ENUMS.INTERPRET_AS.LIST) {
                    input.getTree().recurseTree(function(data,node){
                        inputTree.setDataAtPath(node.getPath(),[data]);
                    });
                }

                inputTree.recurseTree(function(data,node){
                    dataListForTree.push(node);
                });
                if (dataListForTree.length === 0){
                    // DataTree doesn't expose individual nodes, so we have to access it thus:
                    var tree = new DataTree([input.getDefaultValue()]),
                        node = tree.getChildAtPath([0]);
                    dataListForTree.push(node);
                }
                return dataListForTree;
            }

            // gotta know where the master input is, and which params to treat as lists:
            var indexOfMaster = _.indexOf(inputs,masterInput);
            _.each(inputs,function(ipt){
                flattenedNodeList.push(appendUsedDataPaths(ipt));
            });

            // Flattened node list is now an "aligned" array of arrays of nodes. Each node stores an array of data.
            // [                   All data                        ]
            // [ [       input A        ]  [       input B       ] ]
            // [ [ [ node1 ] [ node 2 ] ]  [  [ node1 ] [ node 2 ] ]
            flattenedNodeList = alignArrays(flattenedNodeList);

            // Count number of nodes (same for each input now). For each "row" of lists:
            // -Calculate the correct destination path based on the master list's path
            // -Extract data arrays for each input, build an array of these arrays
            // -Align these data arrays (repeat items until they are comparable lengths
            // -Calculate the result list
            var prevPath = [], prevPathUsed = false;
            for (var rowIndex=0; rowIndex < flattenedNodeList[0].length; rowIndex++){
                var rowData = [],
                    result,
                    destPath;

                // Where in the result tree should this result list be placed?
                if (prevPathUsed === true || _.isEqual(flattenedNodeList[indexOfMaster][rowIndex].getPath(), prevPath) ){
                    // Increment the previous path. Inlined the condition to avoid testing path equality each time.
                    prevPath = destPath = incrementPath(prevPath);
                    prevPathUsed = true;
                } else {
                    prevPath = destPath = flattenedNodeList[indexOfMaster][rowIndex].getPath();
                }

                // build item-aligned input lists:
                for (var inputIndex=0; inputIndex < flattenedNodeList.length; inputIndex++){
                    rowData.push(flattenedNodeList[inputIndex][rowIndex]["data"]);
                }
                rowData = alignArrays(rowData);

                // calculate results item by item, and store
                try {
                    result = calculateItemsForAlignedLists(rowData,calculation);
                } catch (e) {
                    result = [null];
                    console.log('Runtime error during calculation process. Inputs:\n',rowData,'\nCalculation Error:\n', e.stack);
                }
                outputTree.setDataAtPath(destPath,result);
            }

            return outputTree;
        }

        function calculateItemsForAlignedLists(alignedLists,calculation){
            // Here's where we actually DO the calculation for EVERY item in ALL of the lists we're passed.
            // These lists have been aligned with each other by all the methods above, so all we need to do
            // is run the calculation
            var results = [];
            for (var i=0; i < alignedLists[0].length; i++){
                // pull the i-th item from each list as an argument for the calculation
                var args = _.map(alignedLists,function(list){
                    return list[i];
                });
                results[i] = calculation.apply(this,args);
            }
            return results;
        }

        function alignArrays(arrays){
            // Input:   An array of random-length arrays
            // Output:  An array of arrays, each with the length of the longest input array.
            //          The last item of an array is repeated until it is the desired length.
            var outputArrays = [],
                maxArrayLength = _.max(_.map(arrays,function(list){return list.length}));

            _.each(arrays,function(list){
                var outList = [],
                    i=0;
                while (i < maxArrayLength) {
                    if (i < list.length) outList[i] = list[i];  // copy over beginning items
                    else outList[i] = outList[i-1];             // reuse items once the shorter lists run out
                    i++;
                }
                outputArrays.push(outList);
            });
            return outputArrays;
        }

        function incrementPath(path){
            var pathCopy = path.slice(0);
            pathCopy[pathCopy.length-1] = pathCopy[pathCopy.length-1] + 1;
            return pathCopy;
        }

        return DataMatcher;
    }
);