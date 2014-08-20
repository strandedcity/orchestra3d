/*
 *  Glue code to provide access to basic SISL structs from JavaScript, post emscripten compile
 *  emcc *.c -o construct.bc
 *  emcc *.bc -o construct.js -s EXPORTED_FUNCTIONS="['_newPoint','_pointCoords']" -s TOTAL_MEMORY=536870912 -v -O3
 */

#include "sisl-copyright.h"
#include "sislP.h"


double * pointCoords(SISLPoint *pt);
double * pointCoords(SISLPoint *pt)
{
    return pt->ecoef;
}