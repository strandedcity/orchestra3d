require(["appconfig"],function(){
    console.log("defined app config!");
//    require(        ['backbone',    'underscore',   'SISL', 'dataFlow'],
//        function(    Backbone,      _,              SISL,   dataFlow){
//            console.log('starting program!', SISL, dataFlow);
//        }
//    );
    require([
        "spec/dataFlow_core",
        "spec/components/pointFromNumbers",
        "spec/SISL_core",
    ],function(){
        window.executeTests();
    });
});
