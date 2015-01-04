requirejs.config({
    // cache busting during development:
    baseUrl: './',
    urlArgs: "bust=" + (new Date()).getTime(),

    shim: {
        'backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        'parse': {
            deps: ['jquery'],
            exports: 'Parse'
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
        'bootstrap-slider': {
            deps: ['bootstrap']
        },
        'bootstrap3-typeahead': {
            deps: ['bootstrap']
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
        componentSearcher: 'src/application/componentSearcher',

        // general libraries
        jquery: 'lib/jquery-2.1.1.min',
        backbone: 'lib/backbone-min',
        parse: 'lib/parse-1.3.3.min',
        underscore: 'lib/underscore-min',
        bootstrap: 'lib/bootstrap.min',
        'bootstrap3-typeahead': 'lib/bootstrap3-typeahead.min', // https://github.com/bassjobsen/Bootstrap-3-Typeahead
        'bootstrap-slider': 'lib/bootstrap-slider.min', // https://github.com/seiyria/bootstrap-slider

        // geometry & dataflow
        SISL: 'src/SISL',
        dataFlow: 'src/dataFlow',
        CSS3DRenderer: 'src/dataFlow/UI/CSS3DRenderer'
    }
});
