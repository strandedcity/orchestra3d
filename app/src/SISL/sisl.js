define(["src/SISL/compiled"],function(){
    console.warn('Hard-coded bytesize of 8 ??')
    var byteSize = 8;
    var Module = window.Module || {};
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

