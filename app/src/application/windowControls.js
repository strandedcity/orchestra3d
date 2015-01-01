define(["jquery","bootstrap","bootstrap3-typeahead"],function($){
    // THINKING OUT LOUD:
    /*  I really want to be able to do typeaheads for components that aren't loaded yet / require separate modules.
        Math.js, for example, is great, but is also 400kb worth of library code that's not necessary anywhere else
        in the app, so shouldn't the "function" component -- rarely used -- be able to lazy-load?

        However, I need some basic information about this component "pre-loaded" in a register of sorts:
        Component name, description, input list, output list, and function (ie, how to initialize it). Those
        details can go into a "registry" of some kind.

        This registry will ideally be able to populate itself. Perhaps a tall order, but ideally there'd be an
        automatically populated list full of all this information.... and even more ideally, this could be read out
        by something like docco.js to generate documentation simultaneously. That's probably not realistic, since
        docco works with comments but this registry needs to be read in as JSON somehow.

        Perhaps easiest just to have components register themselves when they're loaded, but just require() big
        libraries separately *inside* the component logic.

        I can set up a console.warn() statement to compare the list of loaded components with the list of
        registered components when the jasmine tests run.
     */

    // Bootstrap CSS should be included inline at the bottom of the page
    $.get('componentRegistry.json?'+Math.random(),function(registryData){
        var $input = $('#componentChooser'),
            matcher = function(item,query){
                var re = new RegExp(this.query || query, 'i'),
                    searchable = item.name + " " + item.shortDescription; // + item.functionName ?? Generates more results, but could be confusing
                return searchable.search(re) > -1;
            };
        $input.on('submit',function(e){e.preventDefault();});
        $input.keyup(function(e){
            // hitting escape should clear out the input entirely, not just remove the dropdown
            if(e.keyCode === 27) {
                $input.val("");
                $input.data('active',null);
            }

        });
        $input.typeahead({
            source: registryData,
            highlighter: function (item) {
                var html = item.name + " / " + item.shortDescription;

                // This approach is one line to the plugin's 20 lines and iterating over each character (why???)
                var re = new RegExp(this.query, 'gi');
                return html.replace(re,function (match) {
                    return "<strong>" + match + "</strong>";
                });
            },
            displayText: function(item){
                // This is basically a bug in the plugin. This function is supposed to return the display text, but then
                // I can't format sections differently later (ie, name and description would have to appear in a single
                // HTML string passed from this function, and later matched against.
                //var html = "<span class='typeahead_name'>"+item.name+"</span> <span class='des'>"+item.shortDescription+"</span>";
                return item;
            },
            matcher: matcher,
            sorter: function(items){
                var nameMatch = [],
                    descriptionMatch = [],
                    other = [],
                    re = new RegExp(this.query, 'i');

                while ((item = items.shift())) {
                    if (item.name.search(re) === 0) nameMatch.splice(0,0,item);
                    else if (item.name.search(re) > -1) nameMatch.push(item);
                    else if (item.shortDescription.search(re) > -1) descriptionMatch.push(item);
                    else other.push(item);
                }

                return nameMatch.concat(descriptionMatch,other);
            }
        });
        $input.change(function() {
            var current = $input.typeahead("getActive");
            if (current && matcher(current,$input.val()) === true) {
                // must check that the current value is a match. If not, nothing was actually selected by the user!
                // To test, type something that starts as a match but then empties the list, such as
                // "Vector lkjasldj" and hit enter. Without this condition, the first item that WAS selected is passed.

                // TADA! We have selected a new component.
                console.log(current);
            } else {
                // Bad match, do nothing
            }

            // either way, clear out for next round
            $input.val("");
        });
    });

    return {};
});