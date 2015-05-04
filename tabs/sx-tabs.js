(function () {
    'use strict';
    
    var module = window.angular.module('sx.tabs', ['sx.tabs.tpls']);
    
    module.factory('$sxTabsUtilities', [function () {
        return {
            elementIdPrifixing: 'sx-tab-',
            getElementId: function (tabId) {
                return this.elementIdPrifixing + tabId;
            }
        };
    }]);
    
    module.directive('sxTabs', ['$q', '$http', '$controller', '$compile', '$templateCache', '$timeout', '$sxTabsUtilities', '$tabsConsts',
        function ($q, $http, $controller, $compile, $templateCache, $timeout, $sxTabsUtilities, $tabsConsts) {
            return {
                scope: { 
                    $options: '=sxTabsOptions',
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
                    scope.$tabs = scope.$tabs || {};
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

                    var _performLeaving = function (fromTab, toTab, callback) {
                        scope.leaving = true;
                        if (fromTab && fromTab.$scope) {
                            var options = {
                                toTabId: toTab.id
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
                    
                    scope.switchTab = function (e, id, manually) {
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
                                        _performLeaving(scope.activeTab, tab, function (valid) {
                                            if (valid) {
                                                // invoke tab's controller for the first time
                                                _compileTabContent(tab, function () {
                                                    var fromTabId = scope.activeTab.id;
                                                    scope.activeTab = tab;
                                                    _toggleCover(true, function () {
                                                        // perform tab's entering logic
                                                        _performEntering(fromTabId, tab, function () {
                                                            _toggleCover(false, function () {});
                                                        });
                                                    }); 
                                                });
                                            }
                                        });
                                    });
                                });
                            }
                        }
                    };

                    scope.enableTab = function (id, index) {
                        var tab = scope.$tabs[id];
                        if (tab && !tab.enabled) {
                            // _appendTabHtml(tab);
                            tab.enabled = true;
                            scope.switchTab(null, id, true);
                            scope.$onTabEnabled({tab: tab});
                            _getAndUpdateTabsPlusIconFlag();
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
                    
                    scope.disableTab = function (e, id) {
                        // do not navigate tab since we need remove this tab
                        if (e) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                        
                        var tab = scope.$tabs[id];
                        if (tab && tab.enabled) {
                            _performLeaving(scope.activeTab, tab, function (valid) {
                                if (valid) {
                                    if (scope.activeTab && scope.activeTab.id === tab.id) {
                                        var targetTabId = _getNextEnabledTabId(tab.id);
                                        scope.switchTab(null, targetTabId, true);
                                    }
                                    tab.enabled = false;
                                    scope.$onTabDisabled({tab: tab});
                                    _getAndUpdateTabsPlusIconFlag();
                                }
                            });
                        }
                    };

                    var _firstEnabledTabId = null;
                    // load template for visible tabs in orders
                    // also split tabs into enabled and disabled array
                    window.angular.forEach(scope.$tabs, function (tab) {
                        tab.entered = false;
                        tab.$elementId = $sxTabsUtilities.getElementId(tab.id);
                        _setTemplatePromise(tab);
                        
                        if (tab.enabled && !_firstEnabledTabId) {
                            _firstEnabledTabId = tab.id;
                        }
                    });

                    // switch to the first enabled tab
                    scope.switchTab(null, _firstEnabledTabId, true);
                }
            };
        }
    ]);
}());