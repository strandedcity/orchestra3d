define([
    "jquery",
    "underscore",
    "dataFlow/dataTree"
],function($,_,DataTree){
    var TABLE_ID = "editableTable";

    function TableView(data,x,y,callback){
        this.init.apply(this,arguments);
    }

    TableView.prototype.init = function(data,x,y,callback){
        this.callback = callback;
        this.data = data;

        this.overlay = this.createOverlay();

        this.$tableContainer = this.insertTable(x,y);
        this.$table = this.$tableContainer.find('#' + TABLE_ID); // convenience

        this.populate(data,this.$table);
    };

    TableView.prototype.populate = function(tree,$table){
        tree.recurseTree(function(data,node){
            // print column headers -- these are not editable:
            var path = node.getPath(),
                headerHtml = "<tr><td class='headerRow'>{"+path.join(";")+"}</td></tr>";
            $table.append($(headerHtml));

            _.each(data,function(item,index){
                var number = _.isNumber(item),
                    bool = _.isBoolean(item),
                    editable = number || bool,
                    cssClass = editable ? "" : "non",
                    dataString = item.toString();
                var html = "<tr><td contentEditable='"+editable+"' class='"+cssClass+"editData'>"+dataString+"</td></tr>";
                var $tr = $(html);
                $table.append($tr);
                $tr.find('td').data({
                    'd': dataString,
                    'f': function(newData){
                        var parsedData = item; // can't parse it? do jack.

                        var parsingTest = Number(newData);
                        // try parsing as a number
                        if (!_.isNaN(parsingTest)) {
                            parsedData = parsingTest;
                        } else {
                            if (newData.toString().toLowerCase().slice(0,1) === "t") parsedData = true;
                            if (newData.toString().toLowerCase().slice(0,1) === "f") parsedData = false;
                        }

                        // replace this item of the array with spec'd data
                        data[index] = parsedData;

                        $tr.find('td').text(parsedData); // make any standardization kinds of fixes that may be needed
                    }
                });
            });
        });

        $('.editData').on('focus', function(e) {
            selectElementContents(this);
        }).on('blur',function(){
            if ($(this).data('d') !== $(this).text()){
                var setCorrespondingDataFunction = $(this).data('f');
                setCorrespondingDataFunction($(this).text());
            }
        });

        function selectElementContents(el) {
            var range = document.createRange();
            range.selectNodeContents(el);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    };

    // You might think this is combinable with other overlays, but actually almost all of the overlay code is unique since it
    // relates to the destruction of other stuff in the specific class....
    TableView.prototype.createOverlay = function(){
        var id = "overlay_"+Math.floor(Math.random()*10000);
        var overlay = $("<div id='"+id+"' class='TOP workspaceOverlay'></div>");
        $('body').append(overlay);

        var that = this;
        overlay.on('click',function(){
            that.overlay.off();
            that.overlay.remove();
            that.destroy();
        });

        return overlay;
    };

    TableView.prototype.destroy = function(){
        $('.editData').off();
        this.$tableContainer.remove();
        if (typeof this.callback === "function") this.callback();
    };

    TableView.prototype.insertTable = function(x,y){
        // add tableview at spec'd position
        var $tableContainer = $("<div class='tableView'><table id='" + TABLE_ID + "'></table></div>");
        $tableContainer.css({
            top: y,
            left: x
        });
        $('body').append($tableContainer);

        return $tableContainer;
    };

    return TableView;
});
