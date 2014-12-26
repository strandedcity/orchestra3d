/*
 *  Glue code to provide access to basic SISL structs from JavaScript, post emscripten compile
 *  source ~/emsdk-portable/emsdk_set_env.sh
 *  OR: ~/emscripten/emcc [arguments from below]
 *  emcc *.c -o ../compiled.js -s EXPORTED_FUNCTIONS="['_newCurve','_s1240','_s1227','_s1303']" -s TOTAL_MEMORY=536870912 -v -O3 --memory-init-file 0
 */

#include "sisl-copyright.h"
#include "sislP.h"

// Deprecated 12/2014 with removal of SISLPoint as a struct used directly in JS
//double * pointCoords(SISLPoint *pt);
//double * pointCoords(SISLPoint *pt)
//{
//    return pt->ecoef;
//}

// from example07
//// read curve from file
//SISLCurve* cv = readGoCurve(is);
//
//// computing length of curve
//double epsge = 1.0e-5; // geometric tolerance
//double length = 0;
//int jstat = 0;
//
//s1240(cv,      // the curve we want to know the length of
//      epsge,   // geometric tolerance
//      &length, // the calculated length
//      &jstat); // status report variable
//
//if (jstat < 0) {
//    throw runtime_error("Error occured inside call to SISL routine s1240.");
//} else if (jstat > 0) {
//    cerr << "WARNING: warning occured inside call to SISL routine s1240. \n"
//     << endl;
//}
//
//cout << "Computed length of curve: " << length << "\n";