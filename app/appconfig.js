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
        'bootstrap': {
            deps: ['jquery']
        },
        'threejs': {
            exports: 'THREE'
        },
        'OrbitControls': {
            deps: ['threejs']
        },
        'CSS3DRenderer': {
            deps: ['threejs']
        },
        sisl_emscripten: {
            exports: 'Module'
        }
    },

    paths: {
        // UI
        viewer: 'src/viewer',
        threejs: 'src/viewer/three.min',
        OrbitControls: 'src/viewer/OrbitControls',
        windowControls: 'src/application/windowControls',

        // general libraries
        jquery: 'lib/jquery-2.1.1.min',
        backbone: 'lib/backbone-min',
        underscore: 'lib/underscore-min',
        bootstrap: 'lib/bootstrap.min',

        // geometry & dataflow
        SISL: 'src/SISL',
        dataFlow: 'src/dataFlow',
        CSS3DRenderer: 'src/dataFlow/UI/CSS3DRenderer'
    }
});
