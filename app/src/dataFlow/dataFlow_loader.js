define([
        "underscore",
        "dataFlow/core",
        "dataFlow/components/boolean",
        "dataFlow/components/number",
        "dataFlow/components/point",
        "dataFlow/components/curve",
        "dataFlow/components/circle",
        "dataFlow/components/treeComponents",
        "dataFlow/components/math_simple"
    ],function(_,core,boolean,number,point,curve,circle,tree,simpleMath){
        var dataFlow = {};
        dataFlow = _.extend(dataFlow,core);

        dataFlow["components"] = {};
        dataFlow["components"]["boolean"] = boolean;
        dataFlow["components"]["number"] = number;
        dataFlow["components"]["point"] = point;
        dataFlow["components"]["curve"] = curve;
        dataFlow["components"]["curve"] = _.extend(dataFlow["components"]["curve"],circle);
        dataFlow["components"]["tree"] = tree;
        dataFlow["components"]["simpleMath"] = simpleMath;

        // TODO: Use this ONCE to create an index, then use the index ?
        dataFlow._iterateComponents = function(callbackNameFunction){
            return (function dig(obj){
                var objKeys = _.keys(obj);
                for (var i=0;i < objKeys.length; i++){
                    var k = objKeys[i];
                    if (typeof obj[k] === "function") {
                        callbackNameFunction(k,obj[k]);
                    } else {
                        dig(obj[k]);
                    }
                }
            })(dataFlow["components"]);

            // The less-clever (maybe clearer?) async loop strategy
            //_.each(_.keys(dataFlow["components"]),function(group){
            //    _.each(_.keys(dataFlow["components"][group]),function(componentKeyName){
            //        callbackNameFunction(componentKeyName,dataFlow["components"][group][componentKeyName]);
            //    })
            //});
        };

        dataFlow.findComponentConstructorByName = function(name){
            var f = null;
            dataFlow._iterateComponents(function(testName,ComponentConstructor){
                if (name === testName) f = ComponentConstructor;
            });
            return f;
        };

        dataFlow.createComponentByName = function(name,args){
            var constructorFunction = dataFlow.findComponentConstructorByName(name);
            if (_.isNull(constructorFunction)) {
                console.warn("Couldn't find component by name: " + name);
                return null;
            }
            return new constructorFunction(args);
        };

        // Add a "componentName" property to EVERY component. Putting this function here prevents me from
        // repeating code in every component class to give it a name. This could be done inelegantly
        // with named constructor functions, but that screws up the structure of DataFlow's inheritance
        (function(){
            dataFlow._iterateComponents(function(name,func){
                func.prototype.componentName = name;
            });
        })();

        return dataFlow;
    }
);