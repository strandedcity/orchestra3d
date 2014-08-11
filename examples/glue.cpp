#include "sisl-copyright.h"

/*
 *
 * $Id: construct.c,v 1.2 2001-03-19 15:58:39 afr Exp $
 *
 */

#include <iostream>
#include <fstream>
#include <string>
#include <stdexcept>

#include "sislP.h"
#include "glue.h"


//===========================================================================
void goPoints(int num_points, double* coords)
//===========================================================================
{
    if (!coords) {
	throw std::runtime_error("zero coordinate pointer given to writeGoPoints.");
    }
    // write standard header
//    go_stream << POINTCLOUD_INSTANCE_TYPE << ' ' << MAJOR_VERSION << ' '
//	      << MINOR_VERSION << " 4 255 255 0 255\n";

    // write the number of points
    std::cout << std::endl;
    std::cout << "points: " << num_points << std::endl;

    // write point coordinates
    for (int i = 0; i < num_points * 3; ++i) {
	std::cout << coords[i];
	if ((i+1) % 3) {
	    std::cout << ' ';
	} else {
	    std::cout << std::endl;
	}
    }
    std::cout << std::endl;
}

//===========================================================================
void goCurve(SISLCurve* curve)
//===========================================================================
{
    if (!curve) {
	throw std::runtime_error("zero pointer given to writeGoCurve()");
    }

//    // write standard header
//    go_stream << CURVE_INSTANCE_TYPE << ' ' << MAJOR_VERSION << ' '
//	      << MINOR_VERSION << " 0\n";

    // write basic curve properties
    const int& dim = curve->idim;
    const int rational = (curve->ikind % 2 == 0) ? 1 : 0;
    std::cout << "Curve dimension: " << dim << " isRational: " << rational << '\n';

    // write bspline basis information
    write_basis(curve->in, curve->ik, curve->et);

    // write control points
    std::cout << "Control points: ";
    int coef_size = curve->in * (rational ? (dim + 1) : dim);
    const double* coef_pointer = rational ? curve->rcoef : curve->ecoef;
    for (int i = 0; i < coef_size; ++i) {
	std::cout << coef_pointer[i] << ' ';
    }
    std::cout << std::endl;
}

void write_basis(const int&n, const int& k, const double* knts)
{
std::cout << "Basis: ";
std::cout << n << ' ' << k << std::endl;
std::cout << "Knots: ";
for (int i = 0; i < n + k; ++i) {
    std::cout << knts[i] << ' ';
}
std::cout << std::endl;
}
