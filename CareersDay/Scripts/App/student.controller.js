angular.module("careersDayApp")
    .controller("studentController", ["$scope", "$state", "$interval", "userService", "companyService",
        function ($scope, $state, $interval, userService, companyService) {
            if (!companyService.companiesLoaded || !userService.userLoaded) {
                $state.transitionTo("home");
            }

            // Unauthorized ?
            if (!userService.isStudent()) {
                console.error("StudentController: Not a student");
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
                console.log("StudentController: Requesting CV status for %s", $scope.data.companies[index].name);

                var hostClientContext = new SP.AppContextSite(clientContext, hostWebUrl);
                var cvList = hostClientContext.get_web().get_lists().getByTitle("CareersDayCVs");

                var camlQuery = new SP.CamlQuery();
                var query = "<View><Query><Where><And>" +
                    "<Eq><FieldRef Name='Email' /><Value Type='Text'>" + $scope.data.user.email + "</Value></Eq>" +
                    "<Eq><FieldRef Name='Company' /><Value Type='Text'>" + $scope.data.companies[index].name + "</Value></Eq>" +
                    "</And></Where></Query></View>";

                camlQuery.set_viewXml(query);
                var items = cvList.getItems(camlQuery);

                clientContext.load(items);
                clientContext.executeQueryAsync(function () {
                    console.log("StudentController: CV status request successful");
                    var enumerator = items.getEnumerator();

                    $scope.data.companies[index].cvUploaded = false;
                    while (enumerator.moveNext()) {
                        var item = enumerator.get_current();

                        $scope.data.companies[index].cvUploaded = true;
                        $scope.data.companies[index].cvLink = item.get_item("FileRef");
                        $scope.data.companies[index].cvFile = item.get_item("FileLeafRef");
                    }

                    // Since this is a callback, $apply to appear changes in the view
                    $scope.$apply();

                }, onError);

            }

            /**
             * Deletes the CV for company given by 'index'
             */
            $scope.deleteCV = function (index) {
                if (!confirm("Your CV will be deleted permenantly")) {
                    return;
                }
                console.log("StudentController: Deleting CV for company %s", $scope.data.companies[index].name);

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
                        clientContext.executeQueryAsync(function () {
                            NotificationService.showSuccessMessage("CV Deleted", "CV deleted successfully");
                            $scope.getCompanyStatus(index);
                        }, onError);
                    }
                }, onError);
            }

            /** 
             * Uploads and saves the CV selected
             */
            $scope.submitCV = function (index) {
                // check the file extension
                if ($('#cv' + index).val().split('.')[1] != 'pdf') {
                    NotificationService.showErrorMessage("Not a PDF", "Please upload you CV in PDF format");
                    return;
                }

                NotificationService.showInfoMessage("CV is being uploaded", "Please wait until the CV is uploaded", true);

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
                        var newName = $scope.data.user.email.split(".").join("-").split("@")[0] + "_" +
                            $scope.data.companies[id].name.split(".").join("-").split(" ").join("-");

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
                                        fileInput.val("");
                                        NotificationService.showSuccessMessage("CV Uploaded", "Your CV uploaded successfully. Please verify by downloading the uploaded CV");

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
                NotificationService.showDefaultErrorMessage();
            }

        }]);