require(["appconfig"],function(){
    console.log("defined app config!");
    require(        ['backbone',    'underscore',   'SISL', 'dataFlow'],
        function(    Backbone,      _,              SISL,   dataFlow){
            console.log('starting program!', SISL, dataFlow);
        }
    );
});
