define([
        "dataFlow/core",
        "dataFlow/boolean",
        "dataFlow/number",
        "dataFlow/point",
        "dataFlow/curve",
        "dataFlow/circle",
        "dataFlow/treeComponents"
    ],function(core,boolean,number,point,curve,circle,tree){
        var dataFlow = {};
        dataFlow = _.extend(dataFlow,core);
        dataFlow = _.extend(dataFlow,boolean);
        dataFlow = _.extend(dataFlow,number);
        dataFlow = _.extend(dataFlow,point);
        dataFlow = _.extend(dataFlow,curve);
        dataFlow = _.extend(dataFlow,circle);
        dataFlow = _.extend(dataFlow,tree);
        return dataFlow;
    }
);