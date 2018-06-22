app.controller('loginController', function ($scope, $rootScope, $http, $window) {
    $scope.redirect = function () {
        $http.get("http://localhost:16557/GetLoginURL").then(function (response) {
            $window.location.href = response.data;
        }, function (response) {
            alert("Can't get URL. Kindly contact Support");
        });
    }
});