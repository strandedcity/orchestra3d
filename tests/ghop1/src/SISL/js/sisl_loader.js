define([
        "underscore",
        "src/SISL/js/sisl",
        "src/SISL/js/constructors"
    ],function(_,Module,constructors){
        var SISL = {};
        SISL["Module"] = Module; // emscripten binds to window.Module, which we'll use inside AMD modules like this
        SISL = _.extend(SISL,constructors);
        return SISL;
    }
);