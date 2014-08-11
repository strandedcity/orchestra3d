#!/bin/sh

echo "Compiling bytecode..."
emcc examples/glue.cpp -o bc/glue.bc -O0 -v
emcc examples/example01.cpp -o bc/example01.bc
echo "Compiling JavaScript..."
emcc bc/* -o js/testmulti3.js -s EXPORTED_FUNCTIONS="['_main','_malloc','_newCurve','_goPoints']" -s NO_EXIT_RUNTIME=1 -v -O0
echo "Done"