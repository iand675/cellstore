'use strict';

angular.module('main')
.controller('ComparisonSearchCtrl', function($scope, $http, $modal, $location, $backend, QueriesService, conceptMaps) {
    $scope.none = 'US-GAAP Taxonomy Concepts';

    $scope.service = (new QueriesService($backend.API_URL + '/_queries/public/api'));
    if (conceptMaps.indexOf($scope.none) < 0) {
        conceptMaps.push($scope.none);
    }
    $scope.conceptMaps = conceptMaps;
    $scope.conceptMapKeys = [];
    $scope.entityIndex = -1;
    $scope.API_URL = $backend.API_URL;
    
    $scope.$on('filterChanged',
        function(event, selection) {
            $scope.selection = selection;

            var src = $location.search();
            
            if (src.map) {
                $scope.map = src.map;
            }
            else {
                $scope.map = conceptMaps[0];
            }
            $scope.selectMap();
            
            if (src.concept) {
                $scope.selection.concept = [].concat(src.concept);
            }
            else {
                $scope.selection.concept = [];
            }

            $scope.dimensions = [];
            Object.keys(src).forEach(function (param) {
                if (param.indexOf(':') !== -1) {
                    if (param.substring(param.length - 9, param.length) === '::default') {
                        var name = param.substring(0, param.length - 9);
                        $scope.dimensions.forEach(function(d) {
                            if (d.name === name)
                            {
                                d.defaultValue = src[param];
                            }
                        });
                    }
                    else {
                        $scope.dimensions.push({ name: param, value: src[param] });
                    }
                    $scope.selection[param] = src[param];
                }
            });
        }
    );

    $scope.$watch(
        function() { 
            return angular.toJson($scope.selection)
        },
        function(newValue) {
            if ($scope.selection) {
                $location.search($scope.selection);            
            }
        }
    );

    $scope.selectMap = function() {
        if ($scope.selection.map === $scope.map)
        {
            return;
        }

        $scope.conceptMapKeys = [];
        $scope.selection.concept = [];
        $scope.selection.map = $scope.map;

        if ($scope.selection.map && $scope.selection.map !== $scope.none)
        {
            $http({
                    method: 'GET',
                    url: $backend.API_URL + '/_queries/public/ConceptMapKeys.jq',
                    params: { _method: 'POST', mapName: $scope.selection.map, 'token' : $scope.token },
                    cache: true
                })
                .success(function (data) {
                    if (data) {
                        $scope.conceptMapKeys = data.mapKeys;
                    }
                })
                .error(function(data, status) {
                    $scope.$emit('error', status, data);
                });
        }
    };

    $scope.addConceptKey = function(item) {
        if (item && $scope.selection.concept.indexOf(item) < 0) {
            $scope.selection.concept.push(item);
        }
        $scope.conceptMapKey = '';
    };

    $scope.addDimension = function () {
        var modalInstance = $modal.open({
            templateUrl: 'dimension.html',
            controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                $scope.dimension = {};
                $scope.ok = function () {
                    $scope.dimension.attempted = true;
                    if(!$scope.dimension.form.$invalid) {
                        $modalInstance.close({
                            name: $scope.dimension.name,
                            value: $scope.dimension.value,
                            defaultValue: $scope.dimension.defaultValue
                        });
                    }
                };

                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };
            }]
        });

        modalInstance.result.then(function (item) {
            if ($scope.dimensions.indexOf(item) < 0) {
                $scope.dimensions.push(item);
                $scope.selection[item.name] = item.value;
                if (item.defaultValue)
                {
                    $scope.selection[item.name + '::default'] = item.defaultValue;
                }
            }
        });
    };

    $scope.getValues = function() {
        if ($scope.conceptMapKey) {
            $scope.addConceptKey($scope.conceptMapKey);
        }
        
        if ($scope.selection.concept.length === 0)
        {
            $scope.$emit('alert', 'Warning', 'Please choose concepts to compare.');
            return;
        }

        $scope.data = [];
        $scope.params = {
            $method: 'POST',
            cik: $scope.selection.cik,
            tag: $scope.selection.tag,
            fiscalYear: $scope.selection.fiscalYear,
            fiscalPeriod: $scope.selection.fiscalPeriod,
            concept: $scope.selection.concept,
            map: ($scope.selection.map !== $scope.none ? $scope.selection.map : null),
            token: $scope.token
        };
        $scope.dimensions.forEach(function(dimension) { 
            $scope.params[dimension.name] = dimension.value; 
            if (dimension.defaultValue)
            {
                $scope.params[dimension.name + ':default'] = dimension.defaultValue; 
            }
        });

        $scope.service.listFacts($scope.params)
            .then(function(data) {
                $scope.data = data.FactTable;
            },
            function(response) {
                $scope.$emit('error', response.status, response.data);
            });
    };
    
    $scope.trimURL = function(url) {
        if (url.length < 40) {
            return url;
        }
        return url.substr(0, 10) + '...' + url.substr(url.length - 30);
    };

    $scope.trim = function(item) {
        return angular.copy(item).splice(4, item.length - 5);
    };

    $scope.clear = function(item) {
        return item.replace('iso4217:', '').replace('xbrli:', '');
    };

    $scope.showText = function(html) {
        $scope.$emit('alert', 'Text Details', html);
    };

    $scope.showNumber = function(value) {
        var n = parseFloat(value);
        if (isNaN(n)) {
            return value;
        }
        return n.toLocaleString();
    };

    $scope.enumerate = function(object) {
        var ret = [];
        $.map(object, function (el) {
            ret.push(el);
        });
        return ret;
    };
    
    $scope.enumerateKeys = function(object) {
        var ret = [];
        $.map(object, function (el, index) {
            if(index === 'xbrl:Entity') {
                $scope.entityIndex = ret.length;
            }
            ret.push(index);
        });
        return ret;
    };

    $scope.isBlock = function(string) {
        if (!string) {
            return false;
        }
        return string.length > 60;
    };

    $scope.getUrl = function(format) {
        var str = $backend.API_URL + '/_queries/public/api/facts.jq';
        var params = angular.copy($scope.params);
        if (format) {
            params['format'] = format;
        }
        var qs = $scope.wwwFormUrlencoded(params);
        if (qs) {
            str += '?' + qs;
        }
        return str;
    };
});
