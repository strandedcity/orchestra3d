requirejs.config({
    //By default load any module IDs from js/lib
//    baseUrl: 'src',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.

    shim: {
        'backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'

        },
        'underscore': {
            exports: '_'
        },
        'jquery': {
            exports: '$'
        }
    },

    paths: {
        jquery: 'lib/jquery-2.1.1.min',
        backbone: 'lib/backbone-min',
        underscore: 'lib/underscore-min',
        SISL: 'src/SISL/js/sisl_loader',
        dataFlow: 'src/dataFlow/src/dataFlow_loader',
        // SISL Module
//        ems_sisl: "src/SISL/js/sisl",
//        ems_utils: "src/SISL/js/emscripten_utils",
//        constructors: "src/SISL/js/constructors"
    }
});

require(        ['backbone',    'underscore',   'SISL', 'dataFlow'],
    function(Backbone,      _,              SISL,   dataFlow){
        console.log('starting program!');
    }
);