'use strict';

angular.module('main')
.controller('ComponentCtrl', function($scope, $route, $http, $backend) {
    $scope.result = [];
    $scope.API_URL = $backend.API_URL;
    $scope.AccessionNumber = $route.current.params.cid;
    $scope.cik = '';
    $scope.cid = $route.current.params.cid;
    $scope.EntityRegistrantName = '';
    $scope.component = '';
    $scope.FiscalYear = '';
    $scope.FiscalPeriod = '';
    $scope.getdata = function() {
        $http({
            method : 'GET',
            url: $backend.API_URL + '/_queries/public/api/components.jq',
            params : {
                '_method' : 'POST',
                'cid' : $scope.cid,
                'token' : $scope.token
            }
        })
        .success(function(data) {
            var a = data.Archives[0]; // must be only one because we query for only one accession number
            $scope.result = a.Components[0];
            $scope.cik = a.CIK.substring(23);
            $scope.EntityRegistrantName = a.EntityRegistrantName;
            $scope.FiscalYear = a.FiscalYear;
            $scope.FiscalPeriod = a.FiscalPeriod;
            $scope.AccessionNumber = a.AccessionNumber;
            var p = $scope.result.NetworkLabel.lastIndexOf(' - ');
            if (p > 0) {
                $scope.component = $scope.result.NetworkLabel.substring(p+3);
            }
            else {
                $scope.component = $scope.result.NetworkLabel;
            }
        })
        .error(function(data, status) {
            $scope.$emit('error', status, data);
        });
    };
    $scope.getdata();
});