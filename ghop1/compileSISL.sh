#!/bin/bash

echo "Building javascript..."

# source ~/emsdk-portable/emsdk_set_env.sh
/home/phil/emscripten/emcc src/SISL/src/*.c -o src/SISL/js/compiled.js -s EXPORTED_FUNCTIONS="['_newPoint','_pointCoords','_newCurve','_s1240','_s1227']" -s TOTAL_MEMORY=536870912 -O3 --memory-init-file 0

