'use strict';

angular.module('main')
.controller('ComparisonFilingsCtrl', function($scope, $backend) {
    $scope.filings = null;
    $scope.error = false;
    $scope.errornoresults = false;

    $backend.Queries.listFilings({
        $method: 'POST',
        cik: $scope.selection.cik,
        tag: $scope.selection.tag,
        fiscalYear: $scope.selection.fiscalYear,
        fiscalPeriod: $scope.selection.fiscalPeriod,
        sic: $scope.selection.sic,
        token: $scope.token
    })
        .then(function(data) {
            $scope.filings = data.Archives;
            $scope.errornoresults = ($scope.filings.length === 0);
        },
        function(response) {
            if (response.status === '401') {
                $scope.error = true;
            } else {
                $scope.$emit('error', response.status, response.data);
            }
        });
    
    $scope.getExportURL = function(format) {
        return $backend.API_URL + '/_queries/public/api/filings.jq?_method=POST&fiscalPeriod=' + $scope.selection.fiscalPeriod + '&fiscalYear=' + $scope.selection.fiscalYear + '&tag=' + $scope.selection.tag + '&sic=' + $scope.selection.sic + '&format=' + format + '&token=' + $scope.token;
    };
});
