define(["dataFlow/dataFlow_loader"],function(dataFlow){
    var graftComponent, numberComponent, booleanTrueComponent, mixedBooleanComponent, pointComponent;

    beforeEach(function(){
        graftComponent = dataFlow.createComponentByName("GraftComponent");

        numberComponent = dataFlow.createComponentByName("NumberComponent");

        booleanTrueComponent = dataFlow.createComponentByName("BooleanTrueComponent");

        mixedBooleanComponent = dataFlow.createComponentByName("BooleanComponent");
        mixedBooleanComponent.output.assignValues([true,false,true,false,true,false]);

        pointComponent = dataFlow.createComponentByName("PointComponent");
    });

    return [["GraftComponent",function(){

        it("Should accept individual connections from number, point, and boolean components",function(){
            expect(function(){
                graftComponent["T"].connectOutput(numberComponent.output);
                graftComponent["T"].connectOutput(booleanTrueComponent.output);
                graftComponent["T"].connectOutput(mixedBooleanComponent.output);
                graftComponent["T"].connectOutput(pointComponent.output);
            }).not.toThrow();

            expect(_.keys(graftComponent.inputs[0]._listeningTo).length).toEqual(1);
        });
        it("Accepts multiple simultaneous connections from number, point, and boolean components",function(){
            expect(function(){
                graftComponent["T"].connectAdditionalOutput(numberComponent.output);
                graftComponent["T"].connectAdditionalOutput(booleanTrueComponent.output);
                graftComponent["T"].connectAdditionalOutput(mixedBooleanComponent.output);
                graftComponent["T"].connectAdditionalOutput(pointComponent.output);
            }).not.toThrow();

            expect(_.keys(graftComponent.inputs[0]._listeningTo).length).toEqual(4);
        });
        it("Triggers recalculation for upstream changes",function(){
            graftComponent["T"].connectOutput(numberComponent.output);

            // check up on a couple key phases of the data bubbling. Can only spy on one thing at a time, so we need to assignValues() twice
            spyOn(graftComponent.output,'replaceData');
            numberComponent.output.assignValues([0,1,1,0,0,1,1,0,0,1]);
            expect(graftComponent.output.replaceData).toHaveBeenCalled();

            spyOn(graftComponent,'recalculate');
            numberComponent.output.assignValues([0,1,1,0,0,1,1,0,0,1]);
            expect(graftComponent.recalculate).toHaveBeenCalled();
        });
        it("Output has grafted data",function(){
            graftComponent["T"].connectOutput(numberComponent.output);
            numberComponent.output.assignValues([0,1,1,0,0,1,1,0,0,1]);

            expect(graftComponent.output.getTree().dataAtPath([0,0])).toEqual([0]);
            expect(graftComponent.output.getTree().dataAtPath([0,1])).toEqual([1]);
            expect(graftComponent.output.getTree().dataAtPath([0,2])).toEqual([1]);
            expect(graftComponent.output.getTree().dataAtPath([0,3])).toEqual([0]);
            expect(graftComponent.output.getTree().dataAtPath([0,4])).toEqual([0]);
            expect(graftComponent.output.getTree().dataAtPath([0,5])).toEqual([1]);
            expect(graftComponent.output.getTree().dataAtPath([0,6])).toEqual([1]);
            expect(graftComponent.output.getTree().dataAtPath([0,7])).toEqual([0]);
            expect(graftComponent.output.getTree().dataAtPath([0,8])).toEqual([0]);
            expect(graftComponent.output.getTree().dataAtPath([0,9])).toEqual([1]);
        });
        it("Output's grafted data tree data updates when input data tree updates",function(){
            graftComponent["T"].connectOutput(numberComponent.output);
            numberComponent.output.assignValues([0,1,1]);
            expect(graftComponent.output.getTree().dataAtPath([0,0])).toEqual([0]);
            expect(graftComponent.output.getTree().dataAtPath([0,1])).toEqual([1]);
            expect(graftComponent.output.getTree().dataAtPath([0,2])).toEqual([1]);

            // change inputs, verify outputs have updated
            numberComponent.output.assignValues([2,3,4]);
            expect(graftComponent.output.getTree().dataAtPath([0,0])).toEqual([2]);
            expect(graftComponent.output.getTree().dataAtPath([0,1])).toEqual([3]);
            expect(graftComponent.output.getTree().dataAtPath([0,2])).toEqual([4]);
        });

    }],["PathMapperComponent",function(){
        it("Should remap like the graft component")

    }]];
});
