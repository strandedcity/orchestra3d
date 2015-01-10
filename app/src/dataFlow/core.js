define([
        "dataFlow/core_IOModels",
        "dataFlow/core_ComponentModel",
        "dataFlow/enums"
    ],function(IOModels,ComponentModel, ENUMS){
        var DataFlow = {};
        DataFlow.OUTPUT_TYPES = ENUMS.OUTPUT_TYPES; // Better to keep enums separate so datamatcher can access them without all of DataFlow
        DataFlow.INTERPRET_AS = ENUMS.INTERPRET_AS; // Better to keep enums separate so datamatcher can access them without all of DataFlow
        DataFlow.Output = IOModels.Output;
        DataFlow.Input = IOModels.Input;
        DataFlow.Component = ComponentModel;

        return DataFlow;
    }
);
