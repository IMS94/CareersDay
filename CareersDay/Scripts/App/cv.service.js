angular.module("careersDayApp").factory("cvService", function () {

    var factory = {};

    factory.loadCVs = function (hostWebUrl, company, callback) {
        console.log("CVService: Loading CVs for %s from %s", company, hostWebUrl);
        var clientContext = SP.ClientContext.get_current();
        var hostClientContext = new SP.AppContextSite(clientContext, hostWebUrl);
        var cvList = hostClientContext.get_web().get_lists().getByTitle("CareersDayCVs");

        var camlQuery = new SP.CamlQuery();
        var query = "<View><Query><Where>" +
            "<Eq><FieldRef Name='Company' /><Value Type='Text'>" + company + "</Value></Eq>" +
            "</Where></Query></View>";
        camlQuery.set_viewXml(query);

        var items = cvList.getItems(camlQuery);

        clientContext.load(items);
        clientContext.executeQueryAsync(function () {
            var enumerator = items.getEnumerator();

            var cvs = [];
            while (enumerator.moveNext()) {
                var cv = enumerator.get_current();
                //console.log(cv.get_fieldValues());
                cvs.push({
                    email: cv.get_item("Email"),
                    company: cv.get_item("Company"),
                    link: cv.get_item("FileRef")
                });
            }

            callback(cvs);
        }, onError);
    }

    function onError(err) {
        console.error(err);
        alert("An error has occured while getting data from the server. This may be due to bad internet connectino or server overload. Please perform the task again.");
    }

    return factory;
});