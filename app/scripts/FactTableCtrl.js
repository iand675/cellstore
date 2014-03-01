angular.module('main').controller('FactTableCtrl', ['$scope', '$route', '$http', '$backend',
 function($scope, $route, $http, $backend) {
  $scope.data = [];
  $scope.columns = [];
  $scope.API_URL = $backend.API_URL;
  $scope.EntityRegistrantName = "";
  $scope.Label = "";
  $scope.NetworkIdentifier = "";
  $scope.AccessionNumber = "";
  $scope.cid = $route.current.params.cid;
  $scope.FiscalYear = "";
  $scope.FiscalPeriod = "";
  $scope.AcceptanceDatetime = "";
  $scope.FormType = "";
  $scope.getdata = function() {
    $http(
      {
        method : 'GET',
        url: $backend.API_URL + '/_queries/public/api/facttable.jq',
        params : {
          "_method" : "POST",
          "cid" : $scope.cid,
          "token" : $scope.token
        },
      }).
      success(function(data, status, headers, config) {
        $scope.data = data.FactTable;
        $scope.Label = data.Label;
        $scope.EntityRegistrantName = data.EntityRegistrantName;
        $scope.NetworkIdentifier = data.NetworkIdentifier;
        $scope.AccessionNumber = data.AccessionNumber;
        $scope.FiscalYear = data.FiscalYear;
        $scope.FiscalPeriod = data.FiscalPeriod;
        $scope.AcceptanceDatetime = data.AcceptanceDatetime;
        $scope.FormType = data.FormType;
        $scope.safeApply();
      }).
      error(function(data, status, headers, config) {
        $scope.$emit("error", status, data);
      });
  };
  $scope.getdata();
  $scope.trimURL = function(url) {
    if (url.length < 40) return url;

    return url.substr(0, 10) + "..." + url.substr(url.length - 30);
  };
  $scope.trim = function(item) {
    return angular.copy(item).splice(4, item.length - 5);
  };
  $scope.clear = function(item) {
    return item.replace("iso4217:", "").replace("xbrli:", "");
  };
  $scope.showText = function(html) {
    $scope.$emit("alert", "Text Details", html);
  };
  $scope.enumerate = function(object) {
    var ret = [];
    $.map(object, function (el, index) {
      ret.push(el);
    });
    return ret;
  };
  $scope.enumerateKeys = function(object) {
    var ret = [];
    $.map(object, function (el, index) {
      ret.push(index);
    });
    return ret;
  };
 }
]);
