(function () {
    'use strict';

    var module = window.angular.module('sx.dropdown-selection', ['ui.bootstrap']);

    module.run(['$templateCache', function ($templateCache) {
        $templateCache.put('$sx-ngtk/dropdown-selection/dropdown-selection.html',
            '<div class="btn-group" dropdown on-toggle="onDropdownToggled(open)" auto-close="outsideClick">' +
            '    <button type="button" class="btn btn-default dropdown-toggle" dropdown-toggle>' +
            '        {{_dropdownTitle}} <span class="caret"></span>' +
            '    </button>' +
            '    <ul class="dropdown-menu" role="menu">' +
            '        <li>' +
            '            <a href="javascript:void(0)" ng-click="onAllClicked($event)">' +
            '                <i ng-class="_dropdownCheckStatus === _dropdownCheckStatuses.checked ? \'fa fw fa-check-square-o\' : (_dropdownCheckStatus === _dropdownCheckStatuses.unchecked ? \'fa fw fa-square-o\' : \'fa fw fa-minus-square-o\')"></i> (All)' +
            '            </a>' +
            '        </li>' +
            '        <li role="separator" class="divider"></li>' +
            '        <li ng-repeat="item in resolvedItems">' +
            '            <a href="javascript:void(0)" ng-click="onClick($event, item)">' +
            '                <i ng-class="item._selected ? \'fa fw fa-check-square-o\' : \'fa fw fa-square-o\'"></i> {{item._text}}' +
            '            </a>' +
            '        </li>' +
            '    </ul>' +
            '</div>'
        );
    }]);

    module.directive('sxDropdownSelection', ['$q', function ($q) {
        return {
            restrict: 'A',
            templateUrl: '$sx-ngtk/dropdown-selection/dropdown-selection.html',
            scope: {
                items: '=items',
                model: '=?ngModel',
                options: '=options'
            },
            link: function (scope, element, attributes, controllers) {
                scope.options = window.angular.merge({}, {
                    updateOnCloseUp: true,
                    updateByRef: true,
                    handlers: {
                        getItemText: function (item, callback) {
                            return callback(item.toString());
                        },
                        getItemSelected: function (item, callback) {
                            return callback(null);
                        },
                        setItemSelected: function (item, selected, callback) {
                            return callback();
                        },
                        getNoneSelectionText: function (callback) {
                            return callback('(None)');
                        },
                        getAllSelectionText: function (selectedItems, callback) {
                            return callback('(All)');
                        },
                        getPartialSelectionText: function (selectedItems, callback) {
                            if (window.angular.isArray(selectedItems)) {
                                if (selectedItems.length === 1) {
                                    this.getItemText(selectedItems[0], function (name) {
                                        return callback(name);
                                    });
                                }
                                else {
                                    return callback('(Partial)');
                                }
                            }
                            else {
                                var keys = Object.keys(selectedItems);
                                if (keys.length === 1) {
                                    this.getItemText(selectedItems[keys[0]], function (name) {
                                        return callback(name);
                                    });
                                }
                                else {
                                    return callback('(Partial)');
                                }
                            }
                        }
                    }
                }, scope.options);

                scope._dropdownCheckStatuses = {
                    checked: 1,
                    unchecked: 2,
                    partial: 3
                };
                scope._dropdownCheckStatus = null;
                scope._dropdownTitle = null;

                var _updateModel = function (byRef) {
                    scope.model = window.angular.isArray(scope.resolvedItems) ? [] : {};
                    window.angular.forEach(scope.resolvedItems, function (item, key) {
                        if (item._selected) {
                            if (window.angular.isArray(scope.resolvedItems)) {
                                scope.model.push(byRef ? item : window.angular.copy(item));
                            }
                            else {
                                scope.model[key] = byRef ? item : window.angular.copy(item);
                            }
                        }
                    });
                };

                var _setItemSelection = function (item, selected, callback) {
                    item._selected = selected;
                    scope.options.handlers.setItemSelected(item, selected, callback);
                };

                var _updateDropdownCheckStatus = function () {
                    var itemLength = 0;
                    var selectedItemLength = 0;
                    var selectedItems = window.angular.isArray(scope.resolvedItems) ? [] : {};
                    window.angular.forEach(scope.resolvedItems, function (item, key) {
                        itemLength++;
                        if (item._selected) {
                            selectedItemLength++;
                            if (window.angular.isArray(selectedItems)) {
                                selectedItems.push(item);
                            }
                            else {
                                selectedItems[key] = item;
                            }
                        }
                    });
                    if (selectedItemLength <= 0) {
                        scope._dropdownCheckStatus = scope._dropdownCheckStatuses.unchecked;
                        scope.options.handlers.getNoneSelectionText(function (text) {
                            scope._dropdownTitle = text;
                        });
                    }
                    else if (selectedItemLength >= itemLength) {
                        scope._dropdownCheckStatus = scope._dropdownCheckStatuses.checked;
                        scope.options.handlers.getAllSelectionText(selectedItems, function (text) {
                            scope._dropdownTitle = text;
                        });
                    }
                    else {
                        scope._dropdownCheckStatus = scope._dropdownCheckStatuses.partial;
                        scope.options.handlers.getPartialSelectionText(selectedItems, function (text) {
                            scope._dropdownTitle = text;
                        });
                    }

                    if (!scope.options.updateOnCloseUp) {
                        _updateModel(scope.options.updateByRef);
                    }
                };

                scope.onClick = function (e, item) {
                    _setItemSelection(item, !item._selected, function () {
                        _updateDropdownCheckStatus();
                    });
                };

                scope.onAllClicked = function (e) {
                    var targetingStatus = (scope._dropdownCheckStatus === scope._dropdownCheckStatuses.checked ?
                        scope._dropdownCheckStatuses.unchecked :
                        scope._dropdownCheckStatuses.checked);
                    var selected = (targetingStatus === scope._dropdownCheckStatuses.checked);
                    var promises = [];
                    window.angular.forEach(scope.resolvedItems, function (item) {
                        promises.push($q(function (resolved, reject) {
                            _setItemSelection(item, selected, function () {
                                return resolved();
                            });
                        }));
                    });
                    $q.all(promises).then(function () {
                        _updateDropdownCheckStatus();
                    });
                };

                scope.onDropdownToggled = function (open) {
                    if (!open) {
                        if (scope.options.updateOnCloseUp) {
                            _updateModel(scope.options.updateByRef);
                        }
                    }
                };

                $q.when(scope.items, function (items) {
                    scope.resolvedItems = items;

                    var promises = [];
                    window.angular.forEach(scope.resolvedItems, function (item) {
                        promises.push($q(function (resolve, reject) {
                            scope.options.handlers.getItemText(item, function (text) {
                                item._text = text;
                                return resolve();
                            });
                        }));
                        promises.push($q(function (resolve, reject) {
                            scope.options.handlers.getItemSelected(item, function (selected) {
                                item._selected = !!selected;
                                return resolve();
                            });
                        }));
                    });
                    $q.all(promises).then(function () {
                        _updateDropdownCheckStatus();
                        _updateModel(scope.options.updateByRef);
                    });
                });
            }
        };
    }]);
})(); 