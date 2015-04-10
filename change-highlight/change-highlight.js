(function () {
    'use strict';

    var module = window.angular.module('sx.changeHighlight', []);

    module.directive('sxChangeHighlight', ['$timeout', '$interval', function ($timeout, $interval) {
        return {
            scope: {
                ngModel: '=',
                timeout: '@',
                interval: '@',
                skip: '@',
                blurRadius: '@',
                color: '@'
            },
            link: function (scope, element, attributes, controllers) {
                scope.timeout = scope.timeout || 1000;
                scope.interval = scope.interval || 100;
                scope.skip = scope.skip || 1;
                scope.blurRadius = scope.blurRadius || 10;
                scope.color = scope.color || '#337ab7';

                var count = 0;
                var _timeout;
                var _interval;
                var _getStyle = function (px) {
                    return '0 0 ' + px + 'px ' + scope.color;
                };

                scope.$watch('ngModel', function () {
                    if (_interval) {
                        $interval.cancel(_interval);
                        _interval = undefined;
                    }
                    if (_timeout) {
                        $timeout.cancel(_timeout);
                        _timeout = undefined;
                    }

                    if (count >= scope.skip) {
                        var px = scope.blurRadius;
                        element.css('text-shadow', _getStyle(px));
                        _timeout = $timeout(function () {
                            _interval = $interval(function () {
                                px = px - 2;
                                if (px > 0) {
                                    element.css('text-shadow', _getStyle(px));
                                }
                                else {
                                    element.css('text-shadow', '');
                                }
                            }, scope.interval, px, false);
                        }, scope.timeout, false);
                    }
                    else {
                        count = count + 1;
                    }
                });
            }
        };
    }]);

}());