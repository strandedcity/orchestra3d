define([
        "src/dataFlow/src/core",
        "src/dataFlow/src/point"
    ],function(core,point){
        var dataFlow = {};
        dataFlow = _.extend(dataFlow,core);
        dataFlow = _.extend(dataFlow,point);
        return dataFlow;
    }
);