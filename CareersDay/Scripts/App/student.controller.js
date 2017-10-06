angular.module("careersDayApp")
    .controller("studentController", ["$scope", "$state", "$interval", "userService", "companyService",
        function ($scope, $state, $interval, userService, companyService) {
            if (!companyService.companiesLoaded) {
                $state.transitionTo("home");
            }

            $scope.data = {
                companies: companyService.companies
            };
        }]);