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
        // 3d viewer
        viewer: 'src/viewer',
        threejs: 'src/viewer/three.min',
        OrbitControls: 'src/viewer/OrbitControls',

        // general libraries
        jquery: 'lib/jquery-2.1.1.min',
        backbone: 'lib/backbone-min',
        underscore: 'lib/underscore-min',

        // geometry & dataflow
        SISL: 'src/SISL',
        dataFlow: 'src/dataFlow',
        CSS3DRenderer: 'src/dataFlow/UI/CSS3DRenderer'
    }
});
