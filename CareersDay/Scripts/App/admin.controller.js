angular.module("careersDayApp")
    .controller("adminController", ["$scope", "$state", "$interval", "userService", "companyService", "studentService",
        function ($scope, $state, $interval, userService, companyService, studentService) {

            if (!userService.userLoaded) {
                $state.transitionTo("home");
            }

            // Unauthorized ?
            if (!userService.isAdmin()) {
                console.error("Not an admin");
                $state.transitionTo("home");
            }

            $scope.data = {
                user: userService.user,
                students: [],
                companies: [],
                companyCSV: null,
                studentCSV: null
            };

            // loading initial list of companies
            companyService.loadCompanies(updateCompanies);

            // loading initial list of students
            studentService.loadStudents(updateStudents);

            $scope.updateCompanies = function () {
                if (!$scope.data.companyCSV || $scope.data.companyCSV.trim().length == 0) {
                    NotificationService.showErrorMessage("No CSV", "No CSV has been pasted");
                    return;
                }

                NotificationService.showInfoMessage("Updating Companies", "Please wait until the company list is updated...", true);

                var csv = $scope.data.companyCSV.trim();
                var lines = csv.split("\n");
                var companies = [];
                for (var i in lines) {
                    var parts = lines[i].split(",");
                    companies.push({
                        name: parts[0].trim(),
                        email: parts[1].trim()
                    });
                }

                companyService.uploadCompanies(companies, function () {
                    NotificationService.showSuccessMessage("Companies Added Successfully", "New companies added successfully");
                    $state.reload();
                });
            }

            $scope.updateStudents = function () {
                if (!$scope.data.studentCSV || $scope.data.studentCSV.trim().length == 0) {
                    NotificationService.showErrorMessage("No CSV", "No CSV has been pasted");
                    return;
                }

                NotificationService.showInfoMessage("Updating Students", "Please wait until the student list is updated...", true);

                var csv = $scope.data.studentCSV.trim();
                var lines = csv.split("\n");
                var students = [];
                for (var i in lines) {
                    var parts = lines[i].split(",");
                    students.push({
                        email: parts[0].trim(),
                        name: parts[1].trim()
                    });
                }

                studentService.uploadStudents(students, function () {
                    NotificationService.showSuccessMessage("Students Added Successfully", "New students added successfully");
                    $state.reload();
                });
            }

            function updateCompanies(companies) {
                console.log("AdminController: Updating companies table");
                $scope.data.companies = companies;
                $scope.$apply();

                $("#companiesTable").DataTable();
            }

            function updateStudents(students) {
                console.log("AdminController: Updating students");
                $scope.data.students = students;
                $scope.$apply();

                $("#studentsTable").DataTable();
            }

        }]);