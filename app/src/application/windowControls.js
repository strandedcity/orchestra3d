define(["bootstrap","bootstrap3-typeahead"],function(){
    // Bootstrap CSS should be included inline at the bottom of the page
    $('#componentChooser').typeahead({source: ["Point(x,y,z)","Slider","Number","f(x,y)","f(x)","f(x,y,z)","Curve(pt,degree)"]});

    return {};
});