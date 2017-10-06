﻿angular.module("careersDayApp")
    .controller("studentController", ["$scope", "$state", "$interval", "userService", "companyService",
        function ($scope, $state, $interval, userService, companyService) {
            if (!companyService.companiesLoaded || !userService.userLoaded) {
                $state.transitionTo("home");
            }

            $scope.data = {
                user: userService.user,
                companies: companyService.companies
            };

            var clientContext = SP.ClientContext.get_current();
            var appWebUrl = userService.appWebUrl;
            var hostWebUrl = userService.hostWebUrl;

            /**
             * Get the status (that is whether a CV for that company is uploaded or not)
             */
            $scope.getCompanyStatus = function (index) {
                console.debug(hostWebUrl);
                var hostClientContext = new SP.AppContextSite(clientContext, hostWebUrl);
                //var cvList = hostClientContext.get_web().get_lists();
                var cvList = hostClientContext.get_web().get_lists().getByTitle("CareersDayCVs");

                //var listInfoArray = clientContext.loadQuery(cvList, 'Include(Title,Fields.Include(Title,InternalName))');

                //clientContext.executeQueryAsync(function () {
                //    for (var i = 0; i < listInfoArray.length; i++) {
                //        var oList = listInfoArray[i];
                //        var collField = oList.get_fields();

                //        var fieldEnumerator = collField.getEnumerator();

                //        while (fieldEnumerator.moveNext()) {
                //            var oField = fieldEnumerator.get_current();

                //            var listInfo = '\nList: ' + oList.get_title() +
                //                '\n\tField Title: ' + oField.get_title() +
                //                '\n\tField Name: ' + oField.get_internalName();
                //            console.log(listInfo);
                //        }
                //    }
                //}, onError);

                //return;

                var camlQuery = new SP.CamlQuery();
                var query = "<View><Query><Where><And>" +
                    "<Eq><FieldRef Name='Email' /><Value Type='Text'>" + $scope.data.user.email + "</Value></Eq>" +
                    "<Eq><FieldRef Name='Company' /><Value Type='Text'>" + $scope.data.companies[index].name + "</Value></Eq>" +
                    "</And></Where></Query></View>";
                console.debug(query);

                camlQuery.set_viewXml(query);
                var items = cvList.getItems(camlQuery);

                clientContext.load(items);
                clientContext.executeQueryAsync(function () {
                    console.debug("CV status request successful");
                    var enumerator = items.getEnumerator();

                    $scope.data.companies[index].cvUploaded = false;
                    while (enumerator.moveNext()) {
                        var tempCompany = enumerator.get_current().get_item("Company");
                        $scope.data.companies[index].cvUploaded = true;
                    }

                    // Since this is a callback, $apply to appear changes in the view
                    $scope.$apply();

                }, onError)

            }

            $scope.submitCV = function (index) {
                // check the file extension
                if ($('#cv' + index).val().split('.')[1] != 'pdf') {
                    console.error("Not a pdf");
                    return;
                }

                var hostClientContext = new SP.AppContextSite(clientContext, hostWebUrl);
                var internshipList = hostClientContext.get_web().get_lists().getByTitle("CareersDayCVs");

                var camlQuery = new SP.CamlQuery();
                var query = "<View><Query><Where><And>" +
                    "<Eq><FieldRef Name='Email' /><Value Type='Text'>" + $scope.data.user.email + "</Value></Eq>" +
                    "<Eq><FieldRef Name='Company' /><Value Type='Text'>" + $scope.data.companies[index].name + "</Value></Eq>" +
                    "</And></Where></Query></View>";
                camlQuery.set_viewXml(query);
                items = internshipList.getItems(camlQuery);

                clientContext.load(items);
                clientContext.executeQueryAsync(function () {
                    var enumerator = items.getEnumerator();

                    // There can be only one matching entry
                    if (enumerator.moveNext()) {
                        enumerator.get_current().deleteObject();
                        clientContext.executeQueryAsync(function () { uploadFile(index) }, onError);
                    } else {
                        // If no previous update is done
                        uploadFile(index);
                    }

                    function uploadFile(id) {
                        // Define the folder path
                        var serverRelativeUrlToFolder = "CareersDayCVs";

                        // Get test values from the file input and text input page controls.
                        // The display name must be unique every time you run the example.
                        var fileInput = $('#cv' + id);
                        var newName = $scope.data.user.email.split(".")[0] + $scope.data.user.email.split(".")[1].split("@")[0] + id;

                        // Initiate method calls using jQuery promises.
                        // Get the local file as an array buffer.
                        var getFile = getFileBuffer();
                        getFile.done(function (arrayBuffer) {

                            // Add the file to the SharePoint folder.
                            var addFile = addFileToFolder(arrayBuffer);
                            addFile.done(function (file, status, xhr) {
                                // Get the list item that corresponds to the uploaded file.
                                var getItem = getListItem(file.d.ListItemAllFields.__deferred.uri);
                                getItem.done(function (listItem, status, xhr) {

                                    // Change the display name and title of the list item.
                                    var changeItem = updateListItem(listItem.d.__metadata);
                                    changeItem.done(function (data, status, xhr) {
                                        console.debug("CV uploaded successfully");

                                        // Change the upload status
                                        $scope.getCompanyStatus(index);

                                    });
                                    changeItem.fail(onError);
                                });
                                getItem.fail(onError);
                            });
                            addFile.fail(onError);
                        });
                        getFile.fail(onError);

                        // Get the local file as an array buffer.
                        function getFileBuffer() {
                            var deferred = $.Deferred();
                            var reader = new FileReader();
                            reader.onloadend = function (e) {
                                deferred.resolve(e.target.result);
                            }
                            reader.onerror = function (e) {
                                deferred.reject(e.target.error);
                            }
                            reader.readAsArrayBuffer(fileInput[0].files[0]);
                            return deferred.promise();
                        }

                        // Add the file to the file collection in the Shared Documents folder.
                        function addFileToFolder(arrayBuffer) {

                            // Get the file name from the file input control on the page.
                            var parts = fileInput[0].value.split('\\');
                            var fileName = parts[parts.length - 1].split(".")[0] + id + "." + parts[parts.length - 1].split(".")[1];

                            // Construct the endpoint.
                            var fileCollectionEndpoint = String.format(
                                "{0}/_api/sp.appcontextsite(@target)/web/getfolderbyserverrelativeurl('{1}')/files" +
                                "/add(overwrite=true, url='{2}')?@target='{3}'",
                                appWebUrl, serverRelativeUrlToFolder, fileName, hostWebUrl);

                            // Send the request and return the response.
                            // This call returns the SharePoint file.
                            return $.ajax({
                                url: fileCollectionEndpoint,
                                type: "POST",
                                data: arrayBuffer,
                                processData: false,
                                headers: {
                                    "accept": "application/json;odata=verbose",
                                    "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                                    //"content-length": arrayBuffer.byteLength
                                }
                            });
                        }

                        // Get the list item that corresponds to the file by calling the file's ListItemAllFields property.
                        function getListItem(fileListItemUri) {

                            // Construct the endpoint.
                            // The list item URI uses the host web, but the cross-domain call is sent to the
                            // add-in web and specifies the host web as the context site.
                            fileListItemUri = fileListItemUri.replace(hostWebUrl, '{0}');
                            fileListItemUri = fileListItemUri.replace('_api/Web', '_api/sp.appcontextsite(@target)/web');

                            var listItemAllFieldsEndpoint = String.format(fileListItemUri + "?@target='{1}'", appWebUrl, hostWebUrl);

                            // Send the request and return the response.
                            return $.ajax({
                                url: listItemAllFieldsEndpoint,
                                type: "GET",
                                headers: { "accept": "application/json;odata=verbose" }
                            });
                        }

                        // Change the display name and title of the list item.
                        function updateListItem(itemMetadata) {

                            // Construct the endpoint.
                            // Specify the host web as the context site.
                            var listItemUri = itemMetadata.uri.replace('_api/Web', '_api/sp.appcontextsite(@target)/web');
                            var listItemEndpoint = String.format(listItemUri + "?@target='{0}'", hostWebUrl);

                            // Define the list item changes. Use the FileLeafRef property to change the display name.
                            // For simplicity, also use the name as the title.
                            // The example gets the list item type from the item's metadata, but you can also get it from the
                            // ListItemEntityTypeFullName property of the list.

                            var body = String.format("{{'__metadata':{{'type':'{0}'}},'FileLeafRef':'{1}','Title':'{2}','Email':'{3}','Company':'{4}'}}",
                                itemMetadata.type, newName, newName, $scope.data.user.email, $scope.data.companies[id].name);

                            // Send the request and return the promise.
                            // This call does not return response content from the server.
                            return $.ajax({
                                url: listItemEndpoint,
                                type: "POST",
                                data: body,
                                headers: {
                                    "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                                    "content-type": "application/json;odata=verbose",
                                    //"content-length": body.length,
                                    "IF-MATCH": itemMetadata.etag,
                                    "X-HTTP-Method": "MERGE",
                                    "If-Match": "*"
                                }
                            });
                        }
                    }

                }, onError);

            }

            function onError(err) {
                console.error(err);
                alert("An error has occured while getting data from the server. This may be due to bad internet connectino or server overload. Please perform the task again.");
            }

        }]);