#!/bin/bash

echo ""
echo "Building javascript..."

# source ~/emsdk-portable/emsdk_set_env.sh

# Run the compile operation!
emcc \
    src/SISL/src/*.c \
    -o src/SISL/compiled.js \
    -s EXPORTED_FUNCTIONS="[
        '_newCurve',
        '_freeSISLCurve',
        '_curveParametricEnd',
        '_curveParametricStart',
        '_s1240', # Compute Curve Length
        '_s1227', # Evaluate 1st Deriv of Curve (parameter value)
        '_s1303', # Circle(center, axis, rotational angle)
        '_s1356' # InterpolateCurve(pointList)
    ]" \
    -s TOTAL_MEMORY=536870912 \
    -O3 \
    --memory-init-file 0

echo "Done."
echo ""