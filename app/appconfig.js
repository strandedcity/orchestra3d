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
        'threejs': {
            exports: 'THREE'
        },
        sisl_emscripten: {
            exports: 'Module'
        }
    },

    paths: {
        threejs: 'src/viewer/three.min',
        jquery: 'lib/jquery-2.1.1.min',
        backbone: 'lib/backbone-min',
        underscore: 'lib/underscore-min',
        SISL: 'src/SISL',
        dataFlow: 'src/dataFlow',
        viewer: 'src/viewer'
    }
});
