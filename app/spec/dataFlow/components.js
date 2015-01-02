define([
    "jquery",
    "underscore",
    "dataFlow/dataFlow_loader",
    "./point", // specs
    "./treeComponents" // specs
],function($,_,DataFlow,pointComponent,treeComponents){
    return ["Components -->",function(){
        describe("All Components -->",function(){
            var componentList = {};
            beforeEach(function(){
                // populate the flat list of components
                DataFlow._iterateComponents(function(name,func){
                    componentList[name] = func;
                });
            });

            it("Each component in the DataFlow namespace has a corresponding description in componentRegistry.json",function(done){
                $.get('componentRegistry.json?'+Math.random(),function(registryData){
                    var funcNames = _.keys(componentList);
                    var registryNames = _.map(registryData,function(item){
                        return item.functionName;
                    });
                    for (var i=0; i<funcNames.length; i++) {
                        since("\"" + funcNames[i] + "\" should be added to the component registry.").
                        expect(_.indexOf(registryNames,funcNames[i])).toBeGreaterThan(-1);
                    }
                    done();
                });
            });
            it("Each component in componentRegistry.json has a corresponding component in the DataFlow namespace",function(done){
                $.get('componentRegistry.json?'+Math.random(),function(registryData){
                    var funcNames = _.keys(componentList);
                    var registryNames = _.map(registryData,function(item){
                        return item.functionName;
                    });
                    for (var i=0; i<registryNames.length; i++) {
                        since("\"" + registryNames[i] + "\" has no matching component in the dataflow namespace. Creating it will throw an error.").
                            expect(_.indexOf(funcNames,registryNames[i])).toBeGreaterThan(-1);
                    }
                    done();
                });
            });
            it("Every component's 'base' properties are overridden by arguments passed to the constructor",function(){
                //since("Instantiating components from JSON requires inputs to be resolved before being passed to the constructor")
                //    .expect()
            });
        });
        describe.apply(this,pointComponent);
        for (var i=0; i<treeComponents.length; i++){
            describe.apply(this,treeComponents[i]);
        }
    }];
});
