define(["jquery","componentSearcher","backbone","underscore"],function($,ComponentSearcher,Backbone,_){
    var Nav = Backbone.View.extend({
        el: '#navContainer',
        template: _.template($('#navTemplate').html()),
        events: {
            'click a': 'handleClick'
        },
        handleClick: function(){
            // Little functions like this can route clicks for everything in the navbar.... straightforward stuff.
            console.log('click detected!');
        },
        initialize: function(){
            var that = this;
            $(document).ready(function(){
                that.render.apply(that);
                that.initSearchbar('componentChooser');
            });
        },
        initSearchbar: function(inputId){
            // Set up the component searcher / typeahead in the main nav menu
            var that = this;
            this.searcher = new ComponentSearcher($('#'+inputId));
            $(this.searcher).on("selectedComponent",function(e,component){
                // the navbar knows nothing about the workspaces that are available.
                // All it can do is request a new component. "Component" objects will be in the form described
                // in componentRegistry.json, but the workspace context only needs the "function name" to create a new one
                // More properties will be added, however, as components are organized into namespaces, so I'm leaving
                // this as the full object for now
                //{
                //    "functionName": "PointComponent",
                //    "name": "Point(x,y,z)",
                //    "shortDescription": "Creates a Point Object from X, Y, and Z coordinate values"
                //}
                that.trigger('createNewComponent',component);
            });
        },
        render: function(){
            var userData = {username: "Phil"}; // STUBBED OUT! The navbar should be templated with the logged in user's stuff.
            var navHTML = this.template(userData);
            this.$el.html(navHTML);
        }
    });

    return Nav;
});