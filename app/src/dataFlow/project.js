define(["underscore","backbone","dataFlow/dataFlow_loader"],function(_,Backbone,DataFlow){
    return Backbone.Model.extend({
        defaults: function(){
            return {
                authorName: "anonymous",
                authorId: "",
                title: "[Untitled]",
                description: "",
                projectId: "",
                createdAt: new Date(),
                updatedAt: new Date(),
                components: []
            }
        },
        initialize: function(opts){
            if (opts.components) {
                this.loadComponentsFromJSON(opts.components);
            }
        },
        addComponentToProject: function(component){
            /* When the component is already defined elsewhere, and just needs to be part of the persistable model */
            var components = this.get('components');
            components.push(component);
            this.set('components',components);
            return this;
        },
        createComponent: function(name,position){
            /* When the component hasn't been defined yet. CAREFUL: This does NOT read all the state from JSON, it just takes two parameters! */
            var pos = position || {x: 0, y: 0},
                newcpt;

            newcpt = DataFlow.createComponentByName(name,{
                position: pos
            });
            this.addComponentToProject(newcpt);
            return this;
        },
        removeComponent: function(component){
            /* Remove all the CONNECTIONS to the component first, then remove the component from the array */
        },
        toJSON: function(){
            var attrs = _.clone(this.attributes);
            attrs.components = _.map(attrs.components,function(cpt){
                return cpt.toJSON();
            });
            return attrs;
        },
        loadComponentsFromJSON: function(json) {
            // loading occurs in two stages since connections can't easily be made until all components are added
            // first step: create each component, and keep track of EVERY IO as they go by so connections can be made directly
            var IOIdsForConnections = {};
            var connectionRoutes = [];
            var components = [];
            _.each(json, function (cpt) {
                var component = DataFlow.createComponentByName(cpt.componentName, _.clone(cpt));
                components.push(component);

                // if the inputs are supposed to be connected to something, keep track of them for a moment
                _.each(cpt.inputs, function (iptJSON) {
                    if (iptJSON.connections.length > 0) {
                        IOIdsForConnections[iptJSON.id] = component[iptJSON.shortName];
                        _.each(iptJSON.connections, function (connectedIptId) {
                            var route = {};
                            route[iptJSON.id] = connectedIptId;
                            connectionRoutes.push(route);
                        });
                    }
                });

                // keep track of all outputs:
                IOIdsForConnections[cpt.output[0].id] = component.output;
            });

            // Now that all the component objects exist, they can be connected to each other:
            _.each(connectionRoutes,function(route){
                var inputId = _.keys(route)[0],
                    outputId = route[inputId],
                    inputObject = IOIdsForConnections[inputId],
                    outputObject = IOIdsForConnections[outputId];

                inputObject.connectAdditionalOutput(outputObject);
            });

            this.set('components',components);
        }
    });
});