/*
 *  Glue code to provide access to basic SISL structs from JavaScript, post emscripten compile
 *  source ~/emsdk-portable/emsdk_set_env.sh
 *  emcc *.c -o ../js/compiled.js -s EXPORTED_FUNCTIONS="['_newPoint','_pointCoords','_newCurve','_s1240']" -s TOTAL_MEMORY=536870912 -v -O3
 */

#include "sisl-copyright.h"
#include "sislP.h"


double * pointCoords(SISLPoint *pt);
double * pointCoords(SISLPoint *pt)
{
    return pt->ecoef;
}