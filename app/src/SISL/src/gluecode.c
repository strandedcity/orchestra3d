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

int curveKnotCnt(SISLCurve *crv);
int curveKnotCnt(SISLCurve *crv)
{
    // # knots =  number of control points plus curve order
    return crv->in + crv->ik;
}

int curveCtrlPtCnt(SISLCurve *crv);
int curveCtrlPtCnt(SISLCurve *crv)
{
    // I'm not sure why this is apparently off by one.
    // But drawing a degree-1 curve with 4 points illustrates very clearly: 
    // only 3 are returned by this function unless 1 is added.
    return crv->in + 1;
}

int curveGetOrder(SISLCurve *crv);
int curveGetOrder(SISLCurve *crv)
{
    return crv->ik;
}

int curveGetKind(SISLCurve *crv);
int curveGetKind(SISLCurve *crv)
{
    return crv->ikind;
}

double * curveGetKnots(SISLCurve *crv);
double * curveGetKnots(SISLCurve *crv)
{
    return crv->et;
}

double * curveGetCtrlPts(SISLCurve *crv);
double * curveGetCtrlPts(SISLCurve *crv)
{
    return crv->ecoef;
}
