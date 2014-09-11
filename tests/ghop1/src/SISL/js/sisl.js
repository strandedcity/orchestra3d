// sisl_emscripten uses a requirejs shim because it binds to window.Module.
// Extend the requirejs configuration to include a shim for the emscripten code
requirejs.config({
    shim: {
        sisl_emscripten: {
            exports: 'Module'
        }
    },
    paths: {
        sisl_emscripten: 'src/SISL/js/compiled'
    }
});

define(["sisl_emscripten"],function(){
    console.warn('Hard-coded bytesize of 8 ??')
    var byteSize = 8;
    Module.Utils = {};

    Module.Utils.copyJSArrayToC = function(array){
        var buffer = Module._malloc(4*4*array.length);

        for (var i=0; i<array.length; i++){
            Module.setValue(buffer + i*byteSize, array[i], 'double');
        }

        return buffer;
    };

    Module.Utils.copyCArrayToJS = function(pointer, length){
        var array = [];
        for (var i=0; i<length; i++){
            array[i] = Module.getValue(pointer + byteSize*i, 'double');
        }
        return array;
    };

    Module.Utils.freeCArrayAtPointer = function(pointer){
        Module._free(pointer);
    };

    return Module;
});

