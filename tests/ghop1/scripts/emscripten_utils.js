if (Module === "undefined") throw new Error("Emscripten JS must load before Utils.")

Module.Utils = {};

Module.Utils.copyJSArrayToC = function(array){
    // Create example data to test float_multiply_array
    var data = new Float32Array(array);

    // Get data byte size, allocate memory on Emscripten heap, and get pointer
    var nDataBytes = data.length * data.BYTES_PER_ELEMENT;
    var dataPtr = Module._malloc(nDataBytes);

    // Copy data to Emscripten heap (directly accessed from Module.HEAPU8)
    var dataHeap = new Uint8Array(Module.HEAPU8.buffer, dataPtr, nDataBytes);
    dataHeap.set(new Uint8Array(data.buffer));

    // return pointer to C array
    return dataHeap.byteOffset;
    // Call function and get result
//    float_multiply_array(2, dataHeap.byteOffset, data.length); // call emscripten function like so
//    var result = new Float32Array(dataHeap.buffer, dataHeap.byteOffset, data.length); // bring results into JS like so
};

Module.Utils.copyCArrayToJS = function(pointer, length){
    var result = new Float32Array(Module.HEAPU8.buffer, pointer, length);
    return result;
};

Module.Utils.freeCArrayAtPointer = function(pointer){
    Module._free(pointer);
};

