requirejs.config({
    // cache busting during development:
    baseUrl: './',
    urlArgs: "bust=" + (new Date()).getTime(),

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
        },
        sisl_emscripten: {
            exports: 'Module'
        }
    },

    paths: {
        jquery: 'lib/jquery-2.1.1.min',
        backbone: 'lib/backbone-min',
        underscore: 'lib/underscore-min',
        SISL: 'src/SISL/sisl_loader',
        dataFlow: 'src/dataFlow/dataFlow_loader'
    }
});
