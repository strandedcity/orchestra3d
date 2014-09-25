define([
    "SISL",
    "./SISL_compiled",
    "./SISL_constructors"
    ],function(SISL,compiled,constructortests){
    describe("----------------- SISL  -----------------",function(){
        describe.apply(this,compiled);
        describe.apply(this,constructortests);
    });
});
