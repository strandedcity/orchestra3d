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
//        sisl_emscripten: 'src/SISL/compiled', // sisl_emscripten uses a requirejs shim because it binds to window.Module.
        dataFlow: 'src/dataFlow/dataFlow_loader'
    }
});
