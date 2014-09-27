require(["appconfig"],function(){
    console.log("defined app config!");
    require(        ['backbone',    'underscore',   'SISL/sisl_loader', 'dataFlow/dataFlow_loader'],
        function(    Backbone,      _,              SISL,   dataFlow){
            console.log('starting program!', SISL, dataFlow);
        }
    );
    require(["viewer/init"],function(viewer){
        console.log(viewer);
        
    });
});
