angular.module("careersDayApp").factory("userService", function () {
    var factory = {
        userLoaded: false,
        user: {
            email: null,
            name: null
        }
    };

    var userType = "Student"; // Admin, Company or Student(default)

    var clientContext = SP.ClientContext.get_current();
    var user = clientContext.get_web().get_currentUser();
    var groups = user.get_groups();

    // Get user groups
    clientContext.load(groups);
    clientContext.executeQueryAsync(function () {
        var enumerator = groups.getEnumerator();

        // It is assumed that one person can only be in one group
        while (enumerator.moveNext()) {
            var group = enumerator.get_current().get_title();
            console.log(group);

            if (group === "Admin" || group === "Company") {
                // Admin person
                userType = group;
                break;
            }

        }

    }, onError);

    // Get user email
    clientContext.load(user);
    clientContext.executeQueryAsync(function () {
        factory.user = {
            email: user.get_email(),
            name: user.get_title()
        };
        console.log(user.get_title());

        factory.userLoaded = true;
    }, onError);

    factory.getUserType = function () {
        return userType;
    }

    function onError(err) {
        console.error(err);
        alert("An error has occured while getting data from the server. This may be due to bad internet connectino or server overload. Please perform the task again.");
    }

    factory.appWebUrl = decodeURIComponent(getQueryStringParameter("SPAppWebUrl")).split("#")[0];
    factory.hostWebUrl = decodeURIComponent(getQueryStringParameter("SPHostUrl"));

    // Get parameters from the query string.
    function getQueryStringParameter(paramToRetrieve) {
        var params = document.URL.split("?")[1].split("&");
        for (var i = 0; i < params.length; i = i + 1) {
            var singleParam = params[i].split("=");
            if (singleParam[0] == paramToRetrieve) return singleParam[1];
        }
    }

    return factory;
});