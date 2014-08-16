// Experiment based on https://groups.google.com/forum/#!topic/emscripten-discuss/k3oTNGasf6s
// And https://github.com/slembcke/Chipmunk2D/blob/master/include/chipmunk/cpVect.h

// emcc *.c -o out.bc
// emcc *.bc -o output.js -s EXPORTED_FUNCTIONS="['_testThis']" -s TOTAL_MEMORY=536870912 -s NO_EXIT_RUNTIME=1 -v -O3


//#include <stdio.h>
//
//typedef struct cpVect{float x,y;} cpVect;
//
///// Convenience constructor for cpVect structs.
//static inline cpVect cpv(float x, float y)
//{
//	cpVect v = {x, y};
//	return v;
//}
//
//char* cpvstr(cpVect *v){
//    static char output[50];
//    snprintf(output,50,"%f %f",v->x,v->y);
////    printf("%s",output);
//    return output;
//}
//
//char* testThis()
//{
//        cpVect v = cpv(100.3f, 55.f);
//        return cpvstr(&v);
//}


#include<stdio.h>
#include<stdlib.h>
typedef struct rec
{
        int i;
        float PI;
        char A;
}RECORD;

int main()
{
        RECORD *ptr_one;

        ptr_one = (RECORD *) malloc (sizeof(RECORD));

        (*ptr_one).i = 10;
        (*ptr_one).PI = 3.14;
        (*ptr_one).A = 'a';

        printf("First value: %d\n",(*ptr_one).i);
        printf("Second value: %f\n", (*ptr_one).PI);
        printf("Third value: %c\n", (*ptr_one).A);

//        printf("Pointer: %p\n", *ptr_one);

//        free(ptr_one);

        return 0;
}

int testThis(RECORD *ptr_one)
{
        printf("First value: %d\n",(*ptr_one).i);
        printf("Second value: %f\n", (*ptr_one).PI);
        printf("Third value: %c\n", (*ptr_one).A);

        return (*ptr_one).i;
}