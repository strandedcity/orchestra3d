/*
 *  Glue code to provide access to basic SISL structs from JavaScript, post emscripten compile
 *  Use ./compileSISL.sh to build SISL for JavaScript Usage. Functions to be used are named there.
 */

#include "sisl-copyright.h"
#include "sislP.h"

double curveParametricEnd(SISLCurve *crv);
double curveParametricEnd(SISLCurve *crv)
{
    // # knots =  number of control points plus curve order
    int knotCount = crv->in + crv->ik;
    return crv->et[knotCount-1];
}
double curveParametricStart(SISLCurve *crv);
double curveParametricStart(SISLCurve *crv)
{
    return crv->et[0];
}

void freeSISLCurve(SISLCurve *crv);
void freeSISLCurve(SISLCurve *crv)
{
    if (crv) freeCurve(crv);
}

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