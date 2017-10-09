angular.module("careersDayApp")
    .controller("companyController", ["$scope", "$state", "$interval", "userService", "cvService",
        function ($scope, $state, $interval, userService, cvService) {
            if (!userService.userLoaded) {
                $state.transitionTo("home");
            }

            if (!userService.isCompany()) {
                $state.transitionTo("home");
            }

            $scope.data = {
                user: userService.user,
                cvs: []
            };

            var appWebUrl = userService.appWebUrl;
            var hostWebUrl = userService.hostWebUrl;

            cvService.loadCVs(hostWebUrl, $scope.data.user.company, function (cvs) {
                console.log("CompanyController: %d CVs Loaded", cvs.length);
                $scope.data.cvs = cvs;
                $scope.$apply();

                $('#cvTable').DataTable();
            });

        }]);