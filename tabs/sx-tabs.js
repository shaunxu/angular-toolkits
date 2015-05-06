(function () {
    'use strict';
    
    var module = window.angular.module('sx.tabs', ['sx.tabs.tpls']);
    
    module.directive('sxTabs', ['$q', '$http', '$controller', '$compile', '$templateCache', '$timeout', '$tabsConsts',
        function ($q, $http, $controller, $compile, $templateCache, $timeout, $tabsConsts) {
            return {
                scope: { 
                    $options: '@sxTabsOptions',
                    $tabs: '=sxTabs',
                    $context: '=sxTabsContext',
                    $onTabEnabled: '&sxTabsEnabled',
                    $onTabDisabled: '&sxTabsDisabled'
                },
                templateUrl: $tabsConsts.template,
                link: function (scope, element) {
                    scope.activeTab = {};
                    scope.entering = false;
                    scope.leaving = false;

                    scope.$options = window.angular.extend({}, {
                        cover: {
                            enabled: false,
                            autoAdjustHeight: false,
                            hints: {
                                entering: 'Loading...',
                                leaving: 'Validating...'
                            }
                        }
                    }, scope.$options);

                    scope.$context = scope.$context || {}; 
                    scope.$onTabEnabled = scope.$onTabEnabled || window.angular.noop;
                    scope.$onTabDisabled = scope.$onTabDisabled || window.angular.noop; 

                    var _getAndUpdateTabsPlusIconFlag = function () {
                        var result = false;
                        window.angular.forEach(scope.$tabs, function (tab) {
                            if (!tab.enabled) {
                                result = true;
                            }
                        });
                        scope.showTabsPlusIcon = result;
                        return result;
                    };
                    scope.showTabsPlusIcon = _getAndUpdateTabsPlusIconFlag();
                    
                    var _toggleCover = function (showCover, callback) {
                        var containerElement = element.find('.sx-tabs-container');
                        var coverElement = containerElement.find('div.outer');
                        if (scope.$options.cover.enabled) {
                            if (showCover) {
                                if (scope.$options.cover.autoAdjustHeight) {
                                    $timeout(function () {
                                        coverElement.height(containerElement.height());
                                        coverElement.show();
                                        return callback();
                                    });
                                }
                                else {
                                    coverElement.show();
                                    return callback();
                                }
                            }
                            else {
                                coverElement.hide();
                                return callback();
                            }
                        }
                        else {
                            coverElement.hide();
                            return callback();
                        }
                    }; 
                    
                    var _setTemplatePromise = function (tab) {
                        if (tab.template) {
                            tab.$templatePromise = $q.when(tab);
                        }
                        else {
                            tab.$templatePromise = $http.get(tab.templateUrl, {cache: $templateCache}).then(function (response) {
                                tab.template = response.data;
                                return tab;
                            });
                        }
                    };

                    var _performLeaving = function (fromTab, toTab, byTabDisable, callback) {
                        scope.leaving = true;
                        if (fromTab && fromTab.$scope) {
                            var options = {
                                toTabId: toTab.id,
                                byTabDisable: byTabDisable
                            };
                            fromTab.$scope.$context.behavior.leaving(options, function (valid) {
                                scope.leaving = false;
                                return callback(valid);
                            });
                        } 
                        else {
                            scope.leaving = false;
                            return callback(true);
                        }
                    };
                    
                    var _performEntering = function (fromTabId, toTab, callback) {
                        scope.entering = true;
                        toTab.$scope.$context.behavior.entering({
                            fromTabId: fromTabId,
                            entered: toTab.entered
                        }, function () {
                            toTab.entered = true;
                            scope.entering = false;
                            return callback();
                        });
                    };
                    
                    var _compileTabContent = function (tab, callback) { 
                        if (!tab.$scope || !tab.$controller) {
                            tab.$scope = scope.$new();
                            tab.$scope.$context = {
                                data: scope.$context,
                                behavior: {
                                    entering: function (options, callback) {
                                        return callback();
                                    },
                                    leaving: function (options, callback) {
                                        return callback(true);
                                    }
                                }
                            };
                            tab.controller = tab.controller || window.angular.noop;
                            tab.$controller = $controller(tab.controller, {$scope: tab.$scope});
                            // use $timeout to allow browser to have a chance to render the element we've just created
                            // http://stackoverflow.com/q/15660940
                            $timeout(function () {
                                var tabWrapper = element.find('div.tab-wrapper[sx-tab-id="' + tab.id + '"]');
                                tabWrapper.append(tab.template);
                                $compile(tabWrapper.contents())(tab.$scope);
                                return callback();
                            });
                        }
                        else {
                            return callback();
                        }
                    };
                    
                    scope.switchTab = function (options, callback) {
                        callback = callback || window.angular.noop;
                        var e = options.e;
                        var id = options.id;
                        var byTabDisabled = options.byTabDisabled;
                        
                        // skip the default behavior
                        // which will navigate to the bookmark place
                        if (e) {
                            e.preventDefault();
                            e.stopPropagation();
                        } 

                        if (id && (
                            !scope.activeTab || 
                            !scope.activeTab.id || 
                            scope.activeTab.id !== id)) {
                            var tab = scope.$tabs[id];
                            if (tab) {
                                $q.when(tab.$templatePromise).then(function () { 
                                    _toggleCover(true, function () {
                                        // perform tab's leaving logic
                                        _performLeaving(scope.activeTab, tab, byTabDisabled, function (valid) {
                                            if (valid) {
                                                // invoke tab's controller for the first time
                                                _compileTabContent(tab, function () {
                                                    var fromTabId = scope.activeTab.id;
                                                    scope.activeTab = tab;
                                                    _toggleCover(true, function () {
                                                        // perform tab's entering logic
                                                        _performEntering(fromTabId, tab, function () {
                                                            _toggleCover(false, function () {
                                                                return callback(true);
                                                            });
                                                        });
                                                    }); 
                                                });
                                            }
                                            else {
                                                return callback(false);
                                            }
                                        });
                                    });
                                });
                            }
                            else {
                                return callback(false);
                            }
                        }
                        else {
                            return callback(false);
                        }
                    };

                    scope.enableTab = function (id) {
                        var tab = scope.$tabs[id];
                        if (tab && !tab.enabled) {
                            // _appendTabHtml(tab);
                            tab.enabled = true;
                            scope.switchTab({
                                e: null,
                                id: id,
                                byTabDisabled: false
                            }, function (switched) {
                                scope.$onTabEnabled({tab: tab});
                                _getAndUpdateTabsPlusIconFlag();
                            });
                        }
                    };
                    
                    var _getEnabledAndCurrentTabIds = function (currentId) {
                        var enabledTabIds = [];
                        window.angular.forEach(scope.$tabs, function (tab) {
                            if (tab.enabled || tab.id === currentId) {
                                enabledTabIds.push(tab.id);
                            }
                        });
                        return enabledTabIds;
                    };
                    
                    var _getNextEnabledTabId = function (currentId) {
                        var enabledTabIds = _getEnabledAndCurrentTabIds();
                        var currentIndex = enabledTabIds.indexOf(currentId);
                        var targetIndex = null;
                        if (currentIndex > 0) {
                            // current tab is not the first one, move to previous tab
                            targetIndex = currentIndex - 1;
                        }
                        else {
                            // current tab is the first one, move to the next tab
                            targetIndex = currentIndex + 1;
                        }
                        return enabledTabIds[targetIndex];
                    };
                    
                    var _disableTab = function (tab) {
                        tab.enabled = false;
                        scope.$onTabDisabled({tab: tab});
                        _getAndUpdateTabsPlusIconFlag();
                    };
                    
                    scope.disableTab = function (e, id) {
                        // do not navigate tab since we need remove this tab
                        if (e) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                        
                        var tab = scope.$tabs[id];
                        if (tab && tab.enabled) {
                            if (scope.activeTab && scope.activeTab.id === tab.id) {
                                var targetTabId = _getNextEnabledTabId(tab.id);
                                // switch will trigger validation and will disable this tab when switched (validation success)
                                scope.switchTab({
                                    e: null,
                                    id: targetTabId,
                                    byTabDisabled: true
                                }, function (switched) {
                                    if (switched) {
                                        _disableTab(tab);
                                    }
                                });
                            }
                            else {
                                _disableTab(tab);
                            }
                        }
                    };

                    $q.when(scope.$tabs).then(function (tabs) {
                        scope.$tabs = tabs;
                        scope.$tabsOrder = (function () {
                            var orders = [];
                            window.angular.forEach(scope.$tabs, function (tab) {
                                orders.push({
                                    id: tab.id,
                                    order: tab.order,
                                    enabled: tab.enabled
                                });
                            });
                            orders.sort(function (x, y) {
                                return x.order - y.order;
                            });
                            return orders;
                        }());
                    // load template for visible tabs
                    window.angular.forEach(scope.$tabs, function (tab) {
                        tab.entered = false;
                        _setTemplatePromise(tab);
                    });

                    // switch to the first enabled tab
                    scope.switchTab({
                        e: null,
                        id: (function () {
                            var firstEnabledTabId = null;
                            var i = 0;
                            while (i <= scope.$tabsOrder.length - 1) {
                                if (scope.$tabsOrder[i].enabled) {
                                    firstEnabledTabId = scope.$tabsOrder[i].id;
                                    break;
                                }
                                    i = i + 1;
                            }
                            return firstEnabledTabId;
                        }()),
                        byTabDisabled: true
                    }, window.angular.noop);
                    });
                }
            };
        }
    ]);
}());