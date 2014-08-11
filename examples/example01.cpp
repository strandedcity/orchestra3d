/*
 * Copyright (C) 1998, 2000-2007, 2010, 2011, 2012, 2013 SINTEF ICT,
 * Applied Mathematics, Norway.
 *
 * Contact information: E-mail: tor.dokken@sintef.no                      
 * SINTEF ICT, Department of Applied Mathematics,                         
 * P.O. Box 124 Blindern,                                                 
 * 0314 Oslo, Norway.                                                     
 *
 * This file is part of SISL.
 *
 * SISL is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version. 
 *
 * SISL is distributed in the hope that it will be useful,        
 * but WITHOUT ANY WARRANTY; without even the implied warranty of         
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the          
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with SISL. If not, see
 * <http://www.gnu.org/licenses/>.
 *
 * In accordance with Section 7(b) of the GNU Affero General Public
 * License, a covered work must retain the producer line in every data
 * file that is created or manipulated using SISL.
 *
 * Other Usage
 * You can be released from the requirements of the license by purchasing
 * a commercial license. Buying such a license is mandatory as soon as you
 * develop commercial activities involving the SISL library without
 * disclosing the source code of your own applications.
 *
 * This file may be used in accordance with the terms contained in a
 * written agreement between you and SINTEF ICT. 
 */

#include <iostream>
#include <fstream>
#include <string>
#include <stdexcept>

#include "sisl.h"
//#include "GoReadWrite.h"
#include "glue.h"

using namespace std;


namespace {
    string OUT_FILE_CURVE = "example1_curve.g2";
    string OUT_FILE_POINTS = "example1_points.g2";

    string DESCRIPTION = 
    "This program will generate a new SISL spline object from \n"
    "predefined control points and parametrization, and will \n"
    "write the result in Go-format to the file '" + OUT_FILE_CURVE + "'.\n"
    "The curve's control points will be written separately to \n"
    "the file '" + OUT_FILE_POINTS + "'.\n";

    const int number = 10;
    // The order of a NURBS curve defines the number of nearby control points that influence any given point on the curve.
    const int order = 4;
    
    double coef[] = {0,  0,   0,
		     1,  0, 0.5,
		     1,  1,   1,
		     0,  1, 1.5,
		     0,  0,   2,
		     1,  0, 2.5,
		     1,  1,   3,
		     0,  1, 3.5,
		     0,  0,   4,
		     1,  0, 4.5};

//http://en.wikipedia.org/wiki/Non-uniform_rational_B-spline#Knot_vector
//The number of knots is always equal to the number of control points plus curve degree plus one (i.e. number of control points plus curve order)
//For the purposes of representing shapes, however, only the ratios of the difference between the knot values matter; in that case, the knot vectors (0, 0, 1, 2, 3, 3) and (0, 0, 2, 4, 6, 6) produce the same curve.
    double knots[] = {0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 7, 7, 7};

    inline void write_basis(const int&n, const int& k, const double* knts)
    {
    cout << "Basis: ";
	cout << n << ' ' << k << endl;
	cout << "Knots: ";
	for (int i = 0; i < n + k; ++i) {
	    cout << knts[i] << ' ';
	}
	cout << endl;
    }

}; // end anonymous namespace 

//===========================================================================
int main(int avnum, char** vararg)
//===========================================================================
{
    cout << '\n' << vararg[0] << ":\n" << DESCRIPTION << endl;
    cout << "To proceed, press enter, or ^C to quit." << endl;
    getchar();

    try {
	
	SISLCurve* curve = newCurve(number, // number of control points
				    order,  // order of spline curve (degree + 1)
				    knots,  // pointer to knot vector (parametrization)
				    coef,   // pointer to coefficient vector (control points)
				    1,      // kind = polynomial B-spline curve
				    3,      // dimension
				    0);     // no copying of information, 'borrow' arrays
	if (!curve) {
	    throw runtime_error("Error occured while generating curve.");
	}
	
//	ofstream os_curve(OUT_FILE_CURVE.c_str());
//	ofstream os_points(OUT_FILE_POINTS.c_str());
//	if (!os_curve || !os_points) {
//	    throw runtime_error("Unable to open output file.");
//	}
	cout << "Pointer address: " << curve << endl;
	// write result to file
	writeGoCurve(curve);
	writeGoPoints(number, coef);

	// cleaning up
//	freeCurve(curve);
//	os_curve.close();
//	os_points.close();
//
    } catch (exception& e) {
	cerr << "Exception thrown: " << e.what() << endl;
	return 0;
    }

    return 1;
};

//===========================================================================
void writeGoPoints(int num_points, double* coords)
//===========================================================================
{
    if (!coords) {
	throw runtime_error("zero coordinate pointer given to writeGoPoints.");
    }
    // write standard header
//    go_stream << POINTCLOUD_INSTANCE_TYPE << ' ' << MAJOR_VERSION << ' '
//	      << MINOR_VERSION << " 4 255 255 0 255\n";

    // write the number of points
    cout << endl;
    cout << "points: " << num_points << endl;

    // write point coordinates
    for (int i = 0; i < num_points * 3; ++i) {
	cout << coords[i];
	if ((i+1) % 3) {
	    cout << ' ';
	} else {
	    cout << endl;
	}
    }
    cout << endl;
}

//===========================================================================
void writeGoCurve(SISLCurve* curve)
//===========================================================================
{
    if (!curve) {
	throw runtime_error("zero pointer given to writeGoCurve()");
    }

//    // write standard header
//    go_stream << CURVE_INSTANCE_TYPE << ' ' << MAJOR_VERSION << ' '
//	      << MINOR_VERSION << " 0\n";

    // write basic curve properties
    const int& dim = curve->idim;
    const int rational = (curve->ikind % 2 == 0) ? 1 : 0;
    cout << "Curve dimension: " << dim << " isRational: " << rational << '\n';

    // write bspline basis information
    write_basis(curve->in, curve->ik, curve->et);

    // write control points
    cout << "Control points: ";
    int coef_size = curve->in * (rational ? (dim + 1) : dim);
    const double* coef_pointer = rational ? curve->rcoef : curve->ecoef;
    for (int i = 0; i < coef_size; ++i) {
	cout << coef_pointer[i] << ' ';
    }
    cout << endl;
}