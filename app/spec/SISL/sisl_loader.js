define([
    "./compiled",
    "./constructors"
    ],function(compiled,constructortests){
    describe("----------------- SISL  -----------------",function(){
        describe.apply(this,compiled);
        describe.apply(this,constructortests);
    });
});
