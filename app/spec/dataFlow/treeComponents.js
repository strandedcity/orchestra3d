define(["dataFlow/dataFlow_loader"],function(dataFlow){
    return [["GraftComponent",function(){
        var graftComponent, numberComponent, booleanComponent;

        beforeEach(function(){
            graftComponent = new dataFlow.GraftComponent();
            numberComponent = new dataFlow.NumberComponent();
            booleanComponent = new dataFlow.BooleanComponent();
        });

        it("Should accept connections from number, point, and boolean components");
        it("Should allow multiple input connections of the same type");
        it("Should reject additional connections with a type mismatch");
        it("Should change its own type when an input is disconnected, and a new input of a different type is re-connected");
        it("Should trigger 'change' events for upstream changes");
        it("Output has grafted data");
        it("Output's grafted data tree updates when input data tree updates");

    }],["PathMapperComponent",function(){
        it("Should remap like the graft component")

    }]];
});
