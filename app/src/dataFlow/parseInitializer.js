define(["jquery","parse-lib"],function($,Parse) {
    // Just keeping this separate so it doesn't get initialized more than once. Internally, I'll just use "parse" to call this and it'll arrive initialized
    Parse.initialize("PKe6uzh8RhcfpeEfJS7IGId4wr7YbINnhkQnPMFv", "3fINWMPQ0mS9wQXYCosurMA3bb9jHfMpJK26L84v");

    Parse.ORCHESTRA_OBJECTS = {
        PROJECT: Parse.Object.extend("OrchestraProject")
    };

    return Parse;
});
