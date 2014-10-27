define([
        "dataFlow/core",
        "dataFlow/point",
        "dataFlow/number"
    ],function(core,point,number){
        var dataFlow = {};
        dataFlow = _.extend(dataFlow,core);
        dataFlow = _.extend(dataFlow,point);
        dataFlow = _.extend(dataFlow,number);
        return dataFlow;
    }
);