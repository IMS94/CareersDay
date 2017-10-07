angular.module("careersDayApp")
    .controller("companyController", ["$scope", "$state", "$interval", "companyService", "userService",
        function ($scope, $state, $interval, companyService, userService) {
            if (!companyService.companiesLoaded || !userService.userLoaded) {
                $state.transitionTo("home");
            }

            if (userService.getUserType() !== "Company") {
                $state.transitionTo("home");
            }

            $scope.data = {
                user: userService.user,
                company: {
                    name: null,
                    description: null
                }
            };

            var clientContext = SP.ClientContext.get_current();
            var companyList = clientContext.get_web().get_lists().getByTitle("CompanyList");
            var camlQuery = new SP.CamlQuery();
            var collListItem = companyList.getItems(camlQuery);

            clientContext.load(collListItem);
            clientContext.executeQueryAsync(onQuerySuccess, onError);

            function onQuerySuccess() {
                console.log("Company list fetching successful");
                var listItemEnumerator = collListItem.getEnumerator();

                while (listItemEnumerator.moveNext()) {
                    var company = listItemEnumerator.get_current();
                    console.log(company.get_fieldValues());
                    factory.companies.push({
                        name: company.get_item('Title'),
                        description: company.get_item('Bio')
                    });
                }
                factory.companiesLoaded = true;
            }

        }]);