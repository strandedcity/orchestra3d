define([
    "./dataFlow_core",
    "spec/components/pointFromNumbers"
    ],function(core,pointComponent){
    describe("--------------- DataFlow ---------------",function(){
        describe.apply(this,core);
        describe.apply(this,pointComponent);
    });
});
