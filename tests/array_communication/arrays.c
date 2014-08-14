//emcc *.bc -o arrays.js -s EXPORTED_FUNCTIONS="['_float_multiply_array','_printArray','_float_multiply_matrix']" -s TOTAL_MEMORY=536870912 -v -O3

/* Get standard I/O library definitions */
#include <stdio.h>

/* Get standard library definitions (includes malloc defs) */
#include <stdlib.h>

/* Get  string library definitions (includes memcpy defs) */
#include <string.h>

int * printArray()
{
    printf("Hello, JS");
    static int testarray[2];
    testarray[0] = 65;
    testarray[1] = 4;
    return testarray;
}

//Module.ccall('printArray');
//24
//Module.getValue(24,'*');
//65

int float_multiply_array(float factor, float *arr, int length) {
  for (int i = 0; i <  length; i++) {
    arr[i] = factor * arr[i];
  }
  return 0;
}

int float_multiply_matrix(float **arr, int ilength, int jlength) {
  float *row;
  for (int i = 0; i < ilength; i++) {
    row = arr[i];
    for (int j = 0; j < jlength; j++) {
      row[j] = 2.0 * row[j];
    }
  }
  return 0;
}