#!/bin/bash

echo "Building javascript..."

# source ~/emsdk-portable/emsdk_set_env.sh
/home/phil/emscripten/emcc src/SISL/src/*.c -o src/SISL/compiled.js -s EXPORTED_FUNCTIONS="['_newCurve','_freeCurve','_s1240','_s1227','_s1303']" -s TOTAL_MEMORY=536870912 -O3 --memory-init-file 0

