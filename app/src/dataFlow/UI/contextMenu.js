define([
    "jquery",
    "underscore",
    "backbone",
    "dataFlow/dataFlow_loader"
],function($,_,Backbone,DataFlow){
    // prevent multiple context menus by keeping a "singleton" of sorts:
    var singleContextMenu = null,
        template = _.template($('#contextMenu').html()); // precompile once


    var ContextMenu = Backbone.View.extend({
        events: {
            'click input': "keepMenu",
            'contextmenu input': "keepMenu",
            'click a.previewToggle': "togglePreview",
            'click a.deleteComponent': "deleteComponent",
            'keyup input': "editComponentPrettyName"
        },
        template: template,
        initialize: function(opts){
            // Keep track of the one active context menu
            if (!_.isNull(singleContextMenu)) {singleContextMenu.destroy();}
            singleContextMenu = this;

            var x = opts.x,
                y = opts.y;

            // prepare to remove the context menu when necessary
            this.registerCleanup();

            this.render(x,y);
        },
        registerCleanup: function(){
            _.bindAll(this,"destroy");
            this.hideEventHandlers = {click: this.destroy,contextmenu: this.destroy,mousewheel: this.destroy};
            $(document).on(this.hideEventHandlers);
        },
        keepMenu: function(e){
            e.stopPropagation();
        },
        editComponentPrettyName: function(e){
            this.model.set('componentPrettyName',$(e.target).val());
        },
        togglePreview: function(){
            this.model.set('preview',!this.model.get('preview'));
        },
        deleteComponent: function(){
            this.model.destroy();
        },
        render: function(x,y){
            var html = this.template(this.model.toJSON());
            $('body').append(this.$el);

            this.$el.append($(html)).find('div.context-menu').css({
                display: 'block',
                top: y+'px',
                left: x +'px'
            });
        },
        destroy: function(){
            $(document).off(this.hideEventHandlers);
            this.$el.empty();
            this.remove();
            singleContextMenu = null;
        }
    });

    return ContextMenu;
});
