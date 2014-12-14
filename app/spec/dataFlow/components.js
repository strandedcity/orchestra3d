define([
    "./point",
    "./treeComponents"
],function(pointComponent,treeComponents){
    return ["Components -->",function(){
        describe.apply(this,pointComponent);
        for (var i=0; i<treeComponents.length; i++){
            describe.apply(this,treeComponents[i]);
        }
    }];
});
