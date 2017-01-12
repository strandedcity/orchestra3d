define(["threejs"],function(){

    function FileExporter(modelView){
        // Needs access to the modelView object, so that the camera, scene, and current renderer
        // can be accessed when the user requests a file for download.
        if (!modelView) {throw new Error("FileExporter must be instantiated with a viewer");}
        this.modelView = modelView;
        this.reset();
    }

    FileExporter.prototype.export = function(options){
        console.log('attempting to export ', options);
        if (options.type = "SVG") this.downloadSVG(options.geometry);
    };

    FileExporter.prototype.reset = function(){
        this.camera = this.modelView.camera;
        this.width = this.modelView.renderer.getSize().width;
        this.height = this.modelView.renderer.getSize().height;
        this.scale = null;
    };

    FileExporter.prototype.setOrthoView = function(orientation,scale){
        // lets you set the camera to a specific orientation ("top", "left" or "right")
        // then sets the output size and scale to render lines at a particular scale
    };

    FileExporter.prototype.downloadSVG = function(geom){
        // Retrieve previewable geometry from component, then render it using threejs's
        // svgrenderer, exporting that svg to a text file for download
        // The catch is using the current viewer's camera, but removing certain objects (eg: the grid) from
        // the scene.

        var that = this;
        require(["Projector","SVGRenderer"],function(Projector,SVGRenderer){
            // all geometry must somehow fit on the screen in order to be rendered by the SVG renderer. 
            // But that means I don't get the scale I want.
            // So I'll scale DOWN to get all the data in the export, then scale back UP by changing the width and height
            // of the SVG itself.
            var SCALE = 1, ZOOM = 0.2;
            console.warn("HARD-CODED SCALE AND ZOOM SET FOR SVG EXPORT. SHOULD BE CONFIGURABLE");

            that.modelView.setOrtho(true);
            that.modelView.setStandardView("TOP");
            that.modelView.setUnitsAndScale("in",(SCALE*ZOOM)); 
            that.reset(); // Make sure we aren't referencing an old camera or renderer

            var renderer = new THREE.SVGRenderer();
                renderer.setClearColor( 0xffffff );
                renderer.setSize( that.width/(SCALE*ZOOM),that.height/(SCALE*ZOOM));
                renderer.setQuality( 'high' );
            document.body.appendChild( renderer.domElement );
            console.warn("THE SUPPLIED ELEMENTS ARE IGNORED AT EXPORT TIME");
            renderer.render( that.modelView.scene, that.modelView.orthoCamera );


            // Download the SVG
            // a mix of the approaches presented here: 
            // http://stackoverflow.com/questions/23218174/how-do-i-save-export-an-svg-file-after-creating-an-svg-with-d3-js-ie-safari-an
            var svg = renderer.domElement;

            // //get svg source.
            var serializer = new XMLSerializer();
            var source = serializer.serializeToString(svg);

            //add name spaces.
            if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
                source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
            }
            if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
                source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
            }
            
            var svgBlob = new Blob([source], {type:"image/svg+xml;charset=utf-8"});
            var url = URL.createObjectURL(svgBlob);

            //set url value to a element's href attribute.
            var downloadLink = document.createElement("a");
                downloadLink.href = url;
                downloadLink.download = "orchestra-output.svg";
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);

            // remove the SVG Renderer. Not needed until next time!    
            document.body.removeChild(renderer.domElement);

            // Reset the viewer
            that.modelView.setOrtho(false);
            that.modelView.render();
        });

    };

    return function(viewer){
        return new FileExporter(viewer);
    };

});