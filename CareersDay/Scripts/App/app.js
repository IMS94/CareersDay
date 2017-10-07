var app = angular.module('careersDayApp', [
    // Angular modules 

    // Custom modules 

    // 3rd Party Modules
    'ui.router'
]);

app.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/home");

    $stateProvider
        .state("home", {
            url: "/home",
            templateUrl: "home.html",
            controller: "homeController"
        })

        .state("admin", {
            url: "/admin",
            templateUrl: "admin.html",
            controller: "adminController"
        })

        .state("company", {
            url: "/company",
            templateUrl: "company.html",
            controller: "companyController"
        })

        .state("student", {
            url: "/student",
            templateUrl: "student.html",
            controller: "studentController"
        })
});

/**
 * A Global service to show error messages across files.
 */
var NotificationService = {

    showErrorMessage: function (heading, body) {
        $("#progressBar").hide();
        $("#modalHeader").html(heading);
        $("#modalBody").removeClass();
        $("#modalBody").addClass("alert alert-danger");
        $("#modalBody").html(body);
        $("#dialogModal").modal();
    },

    showDefaultErrorMessage: function () {
        $("#progressBar").hide();
        $("#modalHeader").html("Error Occurred");
        $("#modalBody").removeClass();
        $("#modalBody").addClass("alert alert-danger");
        $("#modalBody").html("An error has occured while getting data from the server. This may be due to bad internet connection or server overload. Please perform the task again.");
        $("#dialogModal").modal();
    },

    showSuccessMessage: function (heading, body) {
        $("#progressBar").hide();
        $("#modalHeader").html(heading);
        $("#modalBody").removeClass();
        $("#modalBody").addClass("alert alert-success");
        $("#modalBody").html(body);
        $("#dialogModal").modal();
    },

    showInfoMessage: function (heading, body, progress) {
        if (progress) {
            $("#progressBar").show();
        }
        $("#modalHeader").html(heading);
        $("#modalBody").removeClass();
        $("#modalBody").addClass("alert alert-info");
        $("#modalBody").html(body);
        $("#dialogModal").modal();
    }

};