define(["jquery","componentSearcher","backbone","underscore"],function($,ComponentSearcher,Backbone,_){
    var Nav = Backbone.View.extend({
        el: '#navContainer',
        template: _.template($('#navTemplate').html()),
        events: {
            'click a': 'handleClick',
            'click .openProjectLink': "openProject",
            'click #newProjectButton': "newProject"
        },
        handleClick: function(){
            // Little functions like this can route clicks for everything in the navbar.... straightforward stuff.
            console.log('CLICK NOT IMPLEMENTED');
        },
        openProject: function(e){
            var projectId = $(e.target).attr('id');
            this.trigger('openParseProject',projectId);
        },
        newProject: function(e){
            this.trigger("openNewProject");
        },
        initialize: function(){
            var that = this;
            $(document).ready(function(){
                that.fetchUser.call(that);
                that.render.call(that);
                that.initSearchbar('componentChooser');
            });
        },
        fetchUser: function(){
            var that = this;
            require(["dataFlow/user"],function(User){
                User.fetchCurrentUser(function(currentUser){
                    if (_.isNull(currentUser)) {
                        // show login menu
                        that.$el.find('#nav-loggedin-area').append(_.template($('#user_menu_template_logged_out').html()));
                    } else {
                        // show logged-in view
                        User.fetchProjects(function(list){
                            var model = currentUser.toJSON();
                            that.$el.find('#nav-loggedin-area').append(_.template($('#user_menu_template_logged_in').html(),model));
                        });
                    }
                });
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