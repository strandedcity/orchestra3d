define([
        "dataFlow/core",
        "dataFlow/boolean",
        "dataFlow/number",
        "dataFlow/point",
        "dataFlow/curve"
    ],function(core,boolean,number,point,curve){
        var dataFlow = {};
        dataFlow = _.extend(dataFlow,core);
        dataFlow = _.extend(dataFlow,boolean);
        dataFlow = _.extend(dataFlow,number);
        dataFlow = _.extend(dataFlow,point);
        dataFlow = _.extend(dataFlow,curve);
        return dataFlow;
    }
);