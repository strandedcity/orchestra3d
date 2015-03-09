require(["appconfig"],function() {
    require([
            "jquery",
            "parse"
        ],
        function ($,Parse) {
            $(document).ready(function(){
                $('#inputEmail3').focus();

                function doLogin(e){
                    e.stopPropagation();
                    e.preventDefault();
                    $('#ajaxSpinner').css("display","inline-block");
                    $('#errorMessage').hide();

                    var username = $('#inputEmail3').val(),
                        pass = $('#inputPassword3').val();

                    Parse.User.logIn(username.toLocaleLowerCase(),pass, {
                        success: function(user) {
                            // Do stuff after successful login.
                            var expirationDate = new Date;
                            expirationDate.setMonth(expirationDate.getMonth()+6);
                            document.cookie = "orchestra3duser="+user.id+"; expires="+expirationDate.toGMTString()+"; path=/";
                            if (window.location.href.indexOf("index.html") != -1) {
                                location.reload();
                            } else {
                                window.location = "index.html";
                            }
                        },
                        error: function(user, error) {
                            // The login failed. Check error to see why.
                            showError(error);
                        }
                    });
                }

                function showError(err){
                    $('#ajaxSpinner').css("display","none");
                    var el = $('#errorMessage');
                    el.text(err.message);
                    el.fadeTo('fast',1);
                }

                $('#loginbutton').on('click',function(e){
                    doLogin(e);
                });
            });
            return {};
        });
});
