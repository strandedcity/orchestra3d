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
    Module.Utils = {};

//    Module.Utils.copyJSArrayToC = function(array){
//        // Create example data to test float_multiply_array
//        var data = new Float32Array(array);
//
//        // Get data byte size, allocate memory on Emscripten heap, and get pointer
//        console.log('bytes per element? ',data.BYTES_PER_ELEMENT);
//        var nDataBytes = data.length * data.BYTES_PER_ELEMENT;
//        var dataPtr = Module._malloc(nDataBytes);
//
//        // Copy data to Emscripten heap (directly accessed from Module.HEAPU8)
//        var dataHeap = new Uint8Array(Module.HEAPU8.buffer, dataPtr, nDataBytes);
//        dataHeap.set(new Uint8Array(data.buffer));
//
//        // return pointer to C array
//        return dataHeap.byteOffset;
//        // Call function and get result
//    //    float_multiply_array(2, dataHeap.byteOffset, data.length); // call emscripten function like so
//    //    var result = new Float32Array(dataHeap.buffer, dataHeap.byteOffset, data.length); // bring results into JS like so
//    };

    Module.Utils.copyJSArrayToC = function(array){
//        var buffer      = allocate(16*array.length, 'double', ALLOC_NORMAL);
//        for ( var i=0 ; i<array.length ; i++ )
//        {
//            setValue(buffer+4*(4*i+0), array[i], 'double');
////            setValue(buffer+4*(4*i+1), 0.0, 'float');
////            setValue(buffer+4*(4*i+2), 0.0, 'float');
////            setValue(buffer+4*(4*i+3), 0.0, 'float');
//
//        }
//        return buffer;

        var buffer = Module._malloc(4*4*array.length);

        for (var i=0; i<array.length; i++){
            Module.setValue(buffer + i*8, array[i], 'double');
        }

        return buffer;



//        // Create example data to test float_multiply_array
//        var data = new Float32Array(array);
//
//        // Get data byte size, allocate memory on Emscripten heap, and get pointer
//        console.log('bytes per element? ',data.BYTES_PER_ELEMENT);
//        var nDataBytes = data.length * data.BYTES_PER_ELEMENT;
//        var dataPtr = Module._malloc(nDataBytes);
//
//        // Copy data to Emscripten heap (directly accessed from Module.HEAPU8)
//        var dataHeap = new Int32Array(Module.HEAPU8.buffer, dataPtr, nDataBytes);
//        dataHeap.set(new Int32Array(data.buffer));
//
//        // return pointer to C array
//        return dataHeap.byteOffset;
//        // Call function and get result
//    //    float_multiply_array(2, dataHeap.byteOffset, data.length); // call emscripten function like so
//    //    var result = new Float32Array(dataHeap.buffer, dataHeap.byteOffset, data.length); // bring results into JS like so
    };

    Module.Utils.copyCArrayToJS = function(pointer, length){
        var array = [];
        for (var i=0; i<length; i++){
            array[i] = Module.getValue(pointer + 8*i, 'double');
        }
        return array;
//        var result = new Float32Array(Module.HEAPU8.buffer, pointer, length);
//        return result;
    };

    Module.Utils.freeCArrayAtPointer = function(pointer){
        Module._free(pointer);
    };

    return Module;
});

