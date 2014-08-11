#!/bin/sh

echo "Compiling bytecode..."
emcc examples/example01.cpp -o bc/example01.bc
echo "Compiling JavaScript..."
emcc bc/* -o js/testmulti3.js -s EXPORTED_FUNCTIONS="['_main','_malloc','_newCurve']" -v O3
echo "Done"