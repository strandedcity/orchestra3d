define([
    "./core",
    "./components",
    "./dataTree"
    ],function(core,components,dataTree){
    describe("--------------- DataFlow ---------------",function(){
        describe.apply(this,core);
        describe.apply(this,components);
        describe.apply(this,dataTree);
    });
});
