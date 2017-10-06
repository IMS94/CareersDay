angular.module("careersDayApp").factory("companyService", function () {

    var factory = {
        companiesLoaded: false,
        companies: []
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

    function onError(err) {
        console.log(err);
        alert("An error has occured while getting data from the server. This may be due to bad internet connection or server overload. Please perform the task again.");
    }

    return factory;
});