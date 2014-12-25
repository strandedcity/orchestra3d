define([
    "./core",
    "./components",
    "./dataTree",
    "./dataMatcher"
    ],function(core,components,dataTree,dataMatcher){
    describe("--------------- DataFlow ---------------",function(){
        describe.apply(this,core);
        describe.apply(this,components);
        describe.apply(this,dataTree);
        describe.apply(this,dataMatcher);
    });
});
