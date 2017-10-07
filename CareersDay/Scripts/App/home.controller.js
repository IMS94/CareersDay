angular.module("careersDayApp")
    .controller("homeController", ["$scope", "$state", "$interval", "userService", function ($scope, $state, $interval, userService) {

        var redirectPromise = $interval(function () {
            if (userService.userLoaded) {
                if (userService.isAdmin()) {
                    $state.transitionTo("admin");
                }
                else if (userService.isCompany()) {
                    $state.transitionTo("company");
                }
                else if (userService.isStudent()) {
                    $state.transitionTo("student");
                }
                else {
                    alert("Unauthorized user");
                }

                stopInterval();

            }

        }, 1000);

        function stopInterval() {
            $interval.cancel(redirectPromise);
        }

    }]);