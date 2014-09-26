define([
    "SISL",
    "./compiled",
    "./constructors"
    ],function(SISL,compiled,constructortests){
    describe("----------------- SISL  -----------------",function(){
        describe.apply(this,compiled);
        describe.apply(this,constructortests);
    });
});
