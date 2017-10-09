angular.module("careersDayApp").factory("studentService", function () {

    var factory = {
        studentsLoaded: false,
        students: []
    };
    
    factory.loadStudents = function (callback) {
        var clientContext = SP.ClientContext.get_current();
        var studentList = clientContext.get_web().get_lists().getByTitle("StudentList");
        var camlQuery = new SP.CamlQuery();
        var collListItem = studentList.getItems(camlQuery);

        clientContext.load(collListItem);
        clientContext.executeQueryAsync(function () {
            var listItemEnumerator = collListItem.getEnumerator();

            var students = [];
            while (listItemEnumerator.moveNext()) {
                var student = listItemEnumerator.get_current();
                //console.log(student.get_fieldValues());
                students.push({
                    email: student.get_item('Email'),
                    name: student.get_item('FullName')
                });
            }

            callback(students);
        }, onError);
    }

    factory.uploadStudents = function (students, callback) {
        var clientContext = SP.ClientContext.get_current();
        var studentList = clientContext.get_web().get_lists().getByTitle("StudentList");
        var camlQuery = new SP.CamlQuery();
        var collListItem = studentList.getItems(camlQuery);

        clientContext.load(collListItem);
        clientContext.executeQueryAsync(function () {
            console.log("StudentService: Deleting existing students");
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
                console.log("StudentService: Adding new students");
                // Add every element in the $scope.studentArray
                for (var i in students) {
                    var itemCreationInfo = new SP.ListItemCreationInformation();
                    var newItem = studentList.addItem(itemCreationInfo);
                    newItem.set_item("Email", students[i].email);
                    newItem.set_item("FullName", students[i].name);
                    newItem.update();
                }

                clientContext.executeQueryAsync(function () {
                    console.log("StudentService: New students added successfully");
                    callback();
                }, onError);

            }, onError);
        });
    }

    factory.loadStudents(function (students) {
        //console.log(students);
        factory.students = students;
        factory.studentsLoaded = true;
    });

    function onError(err) {
        console.log(err);
        NotificationService.showDefaultErrorMessage();
    }

    return factory;
});