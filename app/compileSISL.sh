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
        '_curveKnotCnt',
        '_curveCtrlPtCnt',
        '_curveGetOrder',
        '_curveGetKind',
        '_curveGetKnots',
        '_curveGetCtrlPts',
        '_s1240', # Compute Curve Length
        '_s1227', # Evaluate 1st Deriv of Curve (parameter value)
        '_s1303', # Circle(center, axis, rotational angle)
        '_s1356', # InterpolateCurve(pointList)
        '_s1360', # Create an approximation of the offset to a curve within a tolerance
        '_s1857', # Find all the intersections between two curves
        '_s1613', # Approximate a curve with a sequence of straight lines
    ]" \
    -s TOTAL_MEMORY=536870912 \
    -O3 \
    --memory-init-file 0

echo "Done."
echo ""
