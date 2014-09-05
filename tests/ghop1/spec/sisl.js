define([
    "SISL",
    "spec/SISL_compiled",
    "spec/SISL_constructors"
    ],function(SISL,compiled,constructortests){
    describe("----------------- SISL  -----------------",function(){
        describe.apply(this,compiled);
        describe.apply(this,constructortests);
    });
});
