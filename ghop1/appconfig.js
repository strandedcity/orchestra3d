requirejs.config({
    // cache busting during development:
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
        }
    },

    paths: {
        jquery: 'lib/jquery-2.1.1.min',
        backbone: 'lib/backbone-min',
        underscore: 'lib/underscore-min',
        SISL: 'src/SISL/js/sisl_loader',
        dataFlow: 'src/dataFlow/src/dataFlow_loader'
    }
});
