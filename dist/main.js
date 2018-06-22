// declare modules
angular.module('Main', []);
angular.module('login', []);
angular.module('Home', []);
angular.module('Discover', []);
angular.module('Investments', []);


var app = angular.module('Stock-Cues', [
    'ngRoute',
    'ngCookies',
    'ngSanitize',
    'googlechart',
    'ui.bootstrap',
    'Main',
    'login',
    'Home',
    'Discover',
    'Investments'
])

//config route
app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $routeProvider
        .when('/login', {
            controller: 'loginController',
            templateUrl: 'views/Login/login.html'
        })
        .when('/', {
            controller: 'mainController',
            templateUrl: 'views/Main/main.html'
        })
        .otherwise({
            redirectTo: '/login'
        });

    $locationProvider.html5Mode(true);

}]);

// configure our run
app.run(['$rootScope', '$location', '$cookieStore', '$http', function ($rootScope, $location, $cookieStore, $http, $locationProvider) {

    // $rootScope.apiUrl = "http://localhost:16557";

    // keep user logged in after page refresh
    $rootScope.globals = $cookieStore.get('globals') || {};

    // $rootScope.globals.currentUser ='Admin';

    $rootScope.$on('$locationChangeStart', function (event, next, current) {
        $rootScope.globals.code = $location.search().code

        //check if the code and bring user detial from Upstox API 
        if (!$rootScope.globals.code) {
            $location.path('/login');
        }
    });

}]);

window.onbeforeunload = confirmExit;

function confirmExit() {
    return "You have attempted to leave this page. Are you sure?";
}
app.controller('loginController', function ($scope, $rootScope, $http, $window) {
    $scope.redirect = function () {
        $http.get("http://localhost:16557/GetLoginURL").then(function (response) {
            $window.location.href = response.data;
        }, function (response) {
            alert("Can't get URL. Kindly contact Support");
        });
    }
});
app.controller('mainController', function ($scope, $location, $window, $http, $cookieStore) {
    $scope.Data;
    $scope.discoverDetails;
    $scope.link = "views/Pages/discover.html" //initial page to browse
    $scope.strategyId = 0; //type of stratgey 
    $scope.strategyStockData = []; //save th data according to startrgey
    $scope.strategytotalAmount = 0; //total amount of stratgey
    $scope.copyStrategyStockData = []; //copy of data to refresh

    var childWindow = {};
    var currentOrderList = "";
    var user = {};
    var popoutUrl = 'https://pro.upstox.com/trade/';
    var orderlistobj = [];
    $scope.confirmAmount = function () {
        orderlistobj = [];
        orderlistobj.push({
            "symbol": "UNITECH",
            "exchange": "NSE",
            "series": "EQ",
            "quantity": 1,
            "price": 1,
            "side": 'buy',
            "orderType": 'm',
            "position": 'd',
            "tif": 'day',
        });
        orderlistobj.push({
            "symbol": "ANTGRAPHIC",
            "exchange": "NSE",
            "series": "EQ",
            "quantity": 1,
            "price": 1,
            "side": 'buy',
            "orderType": 'm',
            "position": 'd',
            "tif": 'day',
        });
        var _randPopoutUrl = popoutUrl + '?s=' + (Math.random().toString()).slice(2);
        childWindow = window.open(_randPopoutUrl, '_blank', 'width=850,height=560,left=200,top=100');
    }

    // Adding window event listener for communicating with child window
    // The child sends a message 'getOrderList' once it is loaded and ready to receive
    // currentOrderList is send to the child upon receiving of this message
    window.addEventListener('message', function (e) {
        ProcessChildMessage(e.data); // e.data holds the message
        if (e.data != "") {
            var res = e.data.split("|");
            $http({
                method: "GET",
                url: "http://localhost:16557/SaveOrderDetails",
                params: {
                    orderIds: res[1]
                }

            }).then(function successCallback(response) {
                console.log(e.data);

            }, function errorCallback(response) {
                console.log(e.data);
                alert('error');
                $window.location.assign('/login');
            });
        }
    }, false);

    function ProcessChildMessage(message) {
        var _msg = {};
        console.log(orderlistobj);
        switch (message) {
            case 'getOrderList':
                _msg = {
                    type: 'getOrderList',
                    data: orderlistobj
                    //  [{
                    //     "symbol":"UNITECH",
                    //     "exchange": "NSE",
                    //      "series": "EQ",
                    //      "quantity": 1,
                    //     // "price": 1,
                    //      "side": 'buy',
                    //     "orderType": 'm',
                    //     "position": 'd',
                    //      "tif": 'day',
                    //      }
                    //  {
                    //   "symbol":"ESL",
                    // "exchange": "NSE",
                    // "series": "EQ",
                    // "quantity": 1,
                    // "price": 1,
                    // "side": 'buy',
                    // "orderType": 'm',
                    // "position": 'd',
                    // "tif": 'day',
                    //  }]
                    //]
                }
                childWindow.postMessage(JSON.stringify(_msg), "*");
                break;
            case 'getApiKey':
                _msg = {
                    type: 'getApiKey',
                    data: '2nZLD6PYFZ6iC4byDCR302H0xpadNzpU95Ai1RwU'
                }
                childWindow.postMessage(JSON.stringify(_msg), "*");
                break;
            case 'getLoginKey':
                _msg = {
                    type: 'getLoginKey',
                    lka: false
                }

                if (user) {
                    _msg.data = user;
                    _msg.lka = true;
                }

                childWindow.postMessage(JSON.stringify(_msg), "*");
                break;
        }
    }

    if (!$scope.Data) {
        $http({
            method: "GET",
            url: "http://localhost:16557/getUserAllDetails",
            params: {
                code: $location.search().code
            }

        }).then(function successCallback(response) {
            $scope.Data = angular.fromJson(response.data);

        }, function errorCallback(response) {
            alert('error');
            $window.location.assign('/login');
        });
    }

    //on page changed on from menu bar
    $scope.pageChanged = function (pageName) {
        $scope.link = "views/Pages/" + pageName + ".html";
    }

    $scope.changeStrategyID = function (id) {
        $scope.strategyId = id;
        $scope.strategyStockData = [];
        $scope.strategytotalAmount = 0;
        $scope.minStockPrice = 0;
        orderlistobj = [];
        angular.forEach($scope.Data[2], function (value, key) {
            if (value.strategyId == id) {
                $scope.strategytotalAmount += value.currentPrice;
                $scope.strategyStockData.push(value);
                orderlistobj.push({
                    "symbol": value.symbol,
                    "exchange": "NSE",
                    "series": "EQ",
                    "quantity": parseInt(value.qty),
                    // "price": 1,
                    "side": 'buy',
                    "orderType": 'm',
                    "position": 'd',
                    "tif": 'day',
                });
            }
        })

        $scope.minStockPrice = Math.min.apply(Math, $scope.strategyStockData.map(function (stock) {
            return stock.currentPrice;
        }));
        $scope.copyStrategyStockData = angular.copy($scope.strategyStockData);
    }


    $scope.changeAmt = function (budgetAmt) {
        console.log(budgetAmt);
        $scope.strategyStockData = [];
        $scope.strategyStockData = angular.copy($scope.copyStrategyStockData);
        if (!isNaN(budgetAmt)) {
            $scope.changeQty(budgetAmt);
        }
    }

    $scope.changeQty = function (budgetAmt) {
        console.log('call');
        orderlistobj = [];
        if (budgetAmt >= $scope.minStockPrice) {
            angular.forEach($scope.strategyStockData, function (value, key) {
                if (parseFloat(value.currentPrice) <= budgetAmt) {
                    value.qty++;
                    budgetAmt -= value.currentPrice;
                } else {
                    if (budgetAmt == 0 || $scope.minStockPrice >= budgetAmt) {
                        return;
                    }
                }
                orderlistobj.push({
                    "symbol": value.symbol,
                    "exchange": "NSE",
                    "series": "EQ",
                    "quantity": value.qty,
                    // "price": 1,
                    "side": 'buy',
                    "orderType": 'm',
                    "position": 'd',
                    "tif": 'day',
                });
            });
            if ($scope.minStockPrice <= budgetAmt) {
                $scope.changeQty(budgetAmt)
            }
        } else {
            angular.forEach($scope.strategyStockData, function (value, key) {
                orderlistobj.push({
                    "symbol": value.symbol,
                    "exchange": "NSE",
                    "series": "EQ",
                    "quantity": value.qty,
                    // "price": 1,
                    "side": 'buy',
                    "orderType": 'm',
                    "position": 'd',
                    "tif": 'day',
                });
            });
        }
    }

    $scope.myChartObject = {
        "type": "AreaChart",
        "displayed": false,
        "data": {
            "cols": [{
                    "id": "month",
                    "label": "Month",
                    "type": "string",
                    "p": {}
                },
                {
                    "id": "sales",
                    "label": "Sales",
                    "type": "number",
                    "p": {}
                },
                {
                    "id": "expenses",
                    "label": "Expenses",
                    "type": "number",
                    "p": {}
                }
            ],
            "rows": [{
                    "c": [{
                            "v": "3 JAN 2018"
                        },
                        {
                            "v": 250,
                            "f": "42 items"
                        },
                        {
                            "v": 480,
                            "f": "Ony 12 items"
                        }
                    ]
                },
                {
                    "c": [{
                            "v": "9 JAN 2018"
                        },
                        {
                            "v": 280
                        },
                        {
                            "v": 140,
                            "f": "1 unit (Out of stock this month)"
                        }
                    ]
                },
                {
                    "c": [{
                            "v": "15 JAN 2018"
                        },
                        {
                            "v": 102
                        },
                        {
                            "v": 200
                        }
                    ]
                },
                {
                    "c": [{
                            "v": "21 JAN 2018"
                        },
                        {
                            "v": 96
                        },
                        {
                            "v": 450
                        }
                    ]
                }
            ]
        },
        "options": {
            "isStacked": "true",
            "fill": 150,
            "displayExactValues": true,
            "vAxis": {
                "gridlines": {
                    "count": 5
                }
            }
        },
        "formatters": {}
    };

    $scope.myChart = {
        "type": "PieChart",
        "displayed": false,
        "data": {
            "cols": [{
                    id: "t",
                    label: "MF",
                    type: "string"
                },
                {
                    id: "s",
                    label: "INSURANCE",
                    type: "number"
                }
            ],
            "rows": [{
                    c: [{
                            v: "MF"
                        },
                        {
                            v: 20
                        },
                    ]
                },
                {
                    c: [{
                            v: "INSURANCE"
                        },
                        {
                            v: 80
                        }
                    ]
                },
            ],
        },
        "options": {
            colors: ['#cccccc', '#3d6a94'],
            pieStartAngle: 200,
            chartArea: {
                width: '100%',
                height: 250
            },
            legend: {
                position: 'none'
            }
        }
    };

});