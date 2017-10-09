angular.module("careersDayApp").factory("companyService", function () {

    var factory = {
        companiesLoaded: false,
        companies: []
    };

    factory.loadCompanies = function (callback) {
        var clientContext = SP.ClientContext.get_current();
        var companyList = clientContext.get_web().get_lists().getByTitle("CompanyList");
        var camlQuery = new SP.CamlQuery();
        var collListItem = companyList.getItems(camlQuery);

        clientContext.load(collListItem);
        clientContext.executeQueryAsync(function () {
            console.log("CompanyService: Company list fetching successful");
            var listItemEnumerator = collListItem.getEnumerator();

            var companies = [];
            while (listItemEnumerator.moveNext()) {
                var company = listItemEnumerator.get_current();
                //console.log(company.get_fieldValues());
                companies.push({
                    name: company.get_item('Company'),
                    email: company.get_item('Email')
                });
            }

            callback(companies);
        }, onError);
    };

    factory.uploadCompanies = function (companies, callback) {
        var clientContext = SP.ClientContext.get_current();
        var companyList = clientContext.get_web().get_lists().getByTitle("CompanyList");
        var camlQuery = new SP.CamlQuery();
        var collListItem = companyList.getItems(camlQuery);

        clientContext.load(collListItem);
        clientContext.executeQueryAsync(function () {
            console.log("CompanyService: Deleting existing companies");
            var listItemEnumerator = collListItem.getEnumerator();

            var tmpArray = [];
            while (listItemEnumerator.moveNext()) {
                tmpArray.push(listItemEnumerator.get_current());
            }

            for (var i in tmpArray) {
                tmpArray[i].deleteObject();
            }

            // Now execute the delete operation and perform the add operation
            clientContext.executeQueryAsync(function () {
                console.log("CompanyService: Adding new companies");
                // Add every element in the $scope.studentArray
                for (var i in companies) {
                    var itemCreationInfo = new SP.ListItemCreationInformation();
                    var newItem = companyList.addItem(itemCreationInfo);
                    newItem.set_item("Email", companies[i].email);
                    newItem.set_item("Company", companies[i].name);
                    newItem.update();
                }

                clientContext.executeQueryAsync(function () {
                    console.log("CompanyService: New companies added successfully");
                    callback();
                }, onError);

            }, onError);
        });
    }

    factory.loadCompanies(function (companies) {
        console.log("CompanyService: Companies loaded");
        //console.log(companies);
        factory.companies = companies;
        factory.companiesLoaded = true;
    });

    function onError(err) {
        console.log(err);
        NotificationService.showDefaultErrorMessage();
    }

    return factory;
});