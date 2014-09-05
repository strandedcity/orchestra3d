require(["appconfig"],function(){
    require([
        "spec/dataFlow",
        "spec/sisl",
    ],function(){
        window.executeTests();
    });
});
