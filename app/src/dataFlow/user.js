define(["jquery","parse","underscore","backbone"],function($,Parse,_,Backbone){
    var currentUser;

    function fetchCurrentUser(callback){
        currentUser = Parse.User.current();
        if (currentUser) {
            // do stuff with the user
            // user id = currentUser.id
            callback(currentUser);
        } else {
            // show the signup or login page
            callback(null);
        }
    }

    function fetchProjects(callback){
        fetchCurrentUser(function(user){
            if (!_.isNull(user)) {
                if (user.get('projects')) {
                    callback(user.get('projects'));
                } else {
                    var projectQuery = new Parse.Query(Parse.ORCHESTRA_OBJECTS.PROJECT);
                    projectQuery.equalTo("authorId", currentUser.id);
                    projectQuery.select("title");
                    projectQuery.find({
                        success: function(results) {
                            // results has the list of users with a hometown team with a winning record
                            var projectList = _.map(results,function(result){
                                return {
                                    id: result.id,
                                    title: result.get('title')
                                };
                            });
                            user.set('projects',projectList);
                            user.save();
                            callback(user.get('projects'));
                        }
                    });
                }
            } else {
                // null user, no projects!
                callback([]);
            }
        });
    }

    return {
        fetchCurrentUser: fetchCurrentUser,
        fetchProjects: fetchProjects
    }
});