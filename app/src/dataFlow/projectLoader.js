define(["jquery","parse","dataFlow/project"],function($,Parse,Project){
    Parse.initialize("PKe6uzh8RhcfpeEfJS7IGId4wr7YbINnhkQnPMFv", "3fINWMPQ0mS9wQXYCosurMA3bb9jHfMpJK26L84v");

    // I don't want to actually subclass parse objects for all of my models, so to edit existing models I have to keep a reference
    // to the project as retrieved from Parse. That object will stay in memory, and the same object will just be saved with new json
    // from my own project class. That should keep the persistence layer completely separate from the rest of the application,
    // and limit the fallout if I need to ditch parse later.
    var OrchestraProject = Parse.Object.extend("OrchestraProject"),
        currentProject = null;

    function saveProjectToParse(proj){
        var persistable,
            jsonData = proj.toJSON();

        console.log('SAVING: \n\n'+JSON.stringify(jsonData));

        // This method can do UPDATES as well as CREATE-NEW operations, and will, depending on if the project was loaded from parse or elsewhere.
        if (!_.isNull(currentProject) && currentProject.get('objectId') === proj.get('objectId')) persistable = currentProject;
        else persistable = new OrchestraProject();

        persistable.save(jsonData, {
            success: function(object) {
                console.log('SAVED!\n',object);
                proj.set({
                    id: object.id,
                    createdAt: object.createdAt,
                    updatedAt: object.updatedAt
                });
            },
            error: function(model, error) {
                console.log('ERROR');
            }
        });
    }

    function loadProjectFromParse(projectId, callback){
        var query = new Parse.Query(OrchestraProject);
        query.get(projectId, {
            success: function(parseModel) {
                // Store reference in case we want to save changes later. DON'T just return the Parse model,
                // lest we find ourselves dependent on Parse(TM)
                currentProject = parseModel;

                // Create the corresponding native project model, and return it
                callback(new Project(parseModel.toJSON()));
            },
            error: function(object, error) {
                // The object was not retrieved successfully.
                // error is a Parse.Error with an error code and message.
            }
        });
    }

    function loadProjectFromUrl(url, callback){
        $.get(url +Math.random(),function(json){

            // NOT loading from parse, so if the user hits "save" it should make a new parse model:
            currentProject = null;

            callback(new Project(json));
        });
    }

    return {
        saveProjectToParse: saveProjectToParse,
        loadProjectFromParse: loadProjectFromParse,
        loadProjectFromUrl: loadProjectFromUrl
    };
});