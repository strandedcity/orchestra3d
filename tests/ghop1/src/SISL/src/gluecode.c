/*
 *  Glue code to provide access to basic SISL structs from JavaScript, post emscripten compile
 *  emcc *.c -o construct.bc -O3
 *  emcc *.bc -o ../js/compiled.js -s EXPORTED_FUNCTIONS="['_newPoint','_pointCoords','_newCurve']" -s TOTAL_MEMORY=536870912 -v -O3
 */

#include "sisl-copyright.h"
#include "sislP.h"


double * pointCoords(SISLPoint *pt);
double * pointCoords(SISLPoint *pt)
{
    return pt->ecoef;
}