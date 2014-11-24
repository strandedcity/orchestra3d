define([
    "./core",
    "./point",
    "./dataTree"
    ],function(core,pointComponent,dataTree){
    describe("--------------- DataFlow ---------------",function(){
        describe.apply(this,core);
        describe.apply(this,pointComponent);
        describe.apply(this,dataTree);
    });
});
