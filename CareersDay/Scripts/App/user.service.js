angular.module("careersDayApp").factory("userService", function () {
    var factory = {
        userLoaded: false,
        user: {
            email: null,
            name: null
        },
        isAdmin: function () {
            return false;
        },
        isCompany: function () {
            return false;
        },
        isStudent: function () {
            return false;
        }
    };

    var userType = "Student"; // Admin, Company or Student(default)

    var clientContext = SP.ClientContext.get_current();
    var user = clientContext.get_web().get_currentUser();
    var groups = user.get_groups();

    // Get user groups
    clientContext.load(groups);
    clientContext.executeQueryAsync(function () {
        console.log("UserService: User groups fetched successfully");

        var enumerator = groups.getEnumerator();
        // It is assumed that one person can only be in one group
        while (enumerator.moveNext()) {
            var group = enumerator.get_current().get_title();
            console.log("UserService: User group is - %s", group);
            if (group === "Admin" || group === "Company") {
                // Admin person
                userType = group;
                break;
            }
        }

        // Load user information; email, name ...
        loadUser();

    }, onError);

    /**
     * Loads user email and title
     */
    function loadUser() {
        console.log("UserService: Loading user");

        clientContext.load(user);
        clientContext.executeQueryAsync(function () {
            console.log("UserService: User email %s fetched successfully", user.get_email());
            
            factory.user = {
                email: user.get_email(),
                name: user.get_title()
            };

            loadFromUserType();
        }, onError);
    }

    /**
     * Loads additional information from user type. That is, load company information if user type is 'Company'. Student info is "Student".
     */
    function loadFromUserType() {
        console.log("UserService: Loading additional information for user type: %s", userType);

        factory.isCompany = function () {
            return userType === "Company";
        };

        factory.isStudent = function () {
            return userType === "Student";
        };

        factory.isAdmin = function () {
            return userType === "Admin";
        };

        if (userType === "Student") {
            // Then, this user must be in the student list as well
            var studentList = clientContext.get_web().get_lists().getByTitle("StudentList");
            var camlQuery = new SP.CamlQuery();
            var query = "<View><Query><Where>" +
                "<Eq><FieldRef Name='Email' /><Value Type='Text'>" + factory.user.email + "</Value></Eq>" +
                "</Where></Query></View>";
            camlQuery.set_viewXml(query);
            var entries = studentList.getItems(camlQuery);

            clientContext.load(entries);
            clientContext.executeQueryAsync(function () {
                console.log("UserService: Additional user information loaded from student list");
                var enumerator = entries.getEnumerator();
                if (!enumerator.moveNext()) {
                    // not a student
                    console.log("UserService: User is not a student");
                    factory.isStudent = function () {
                        return false;
                    };

                    userType = null;
                } else {
                    factory.user.name = enumerator.get_current().get_item("FullName");
                }

                factory.userLoaded = true;

            }, onError);

        } else if (userType === "Company") {
            // Then, this user must be in the student list as well
            var companyList = clientContext.get_web().get_lists().getByTitle("CompanyList");
            var camlQuery = new SP.CamlQuery();
            var query = "<View><Query><Where>" +
                "<Eq><FieldRef Name='Email' /><Value Type='Text'>" + factory.user.email + "</Value></Eq>" +
                "</Where></Query></View>";
            camlQuery.set_viewXml(query);
            var entries = companyList.getItems(camlQuery);

            clientContext.load(entries);
            clientContext.executeQueryAsync(function () {
                console.log("UserService: Additional company information loaded from company list");
                var enumerator = entries.getEnumerator();
                if (!enumerator.moveNext()) {
                    // not a company
                    console.log("UserService: User is not a Company");
                    factory.isCompany = function () {
                        return false;
                    };

                    userType = null;
                } else {
                    factory.user.company = enumerator.get_current().get_item("Company");
                }

                factory.userLoaded = true;
            }, onError);
        } else {
            factory.userLoaded = true;
        }
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

    factory.getUserType = function () {
        return userType;
    }

    return factory;
});