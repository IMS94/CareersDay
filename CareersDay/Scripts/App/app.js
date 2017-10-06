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