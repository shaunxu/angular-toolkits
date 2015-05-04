(function() {
    'use strict';

    var module = window.angular.module('sx.tabs.tpls', []);

    module.value('$tabsConsts', {
        template: '$sx-ngtk/tabs/tabs.html'
    });

    module.run(['$templateCache', '$tabsConsts',
        function($templateCache, $tabsConsts) {
            $templateCache.put($tabsConsts.template, '' +
                '<div role="tabpanel" class="sx-tabs">' +
                '    <ul class="nav nav-tabs sx-tabs-navigation">' +
                '        <li role="presentation" ' +
                '            ng-repeat="tab in $tabs track by $index"' +
                '            ng-class="tab.id === activeTab.id ? \'active\' : \'\'"' +
                '            ng-show="tab.enabled"' +
                '            sx-tab-nav-id="{{tab.id}}">' +
                '            <a href="javascript:void(0)" ng-click="switchTab($event, tab.id, false)">' +
                '                <button class="close nav-close" ' +
                '                        type="button" ' +
                '                        ng-click="disableTab($event, tab.id)">×' +
                '                </button>{{tab.title}} ' +
                '            </a> ' +
                '        </li>' +
                '        <li class="sx-tabs-nav-plus" ng-show="showTabsPlusIcon">' +
                '            <a class="dropdown-toggle" style="cursor: pointer;" data-toggle="dropdown">' +
                '                <span class="glyphicon glyphicon-plus"></span>' +
                '            </a>' +
                '            <ul class="dropdown-menu" role="menu">' +
                '                <li ng-repeat="tab in $tabs track by $index">' +
                '                    <a ng-click="enableTab(tab.id, $index)" ' +
                '                       ng-hide="tab.enabled"' +
                '                       href="javascript:void(0)">{{tab.title}}' +
                '                    </a>' +
                '                </li>' +
                '            </ul>' +
                '        </li>' +
                '    </ul> ' +
                '    <div class="tab-content sx-tabs-container">' +
                '        <div class="outer" ng-show="$options.cover.enabled">' +
                '            <div class="middle text-info">' +
                '                <div class="inner">' +
                '                    <h1>{{entering ? $options.cover.hints.entering : (leaving ? $options.cover.hints.leaving : \'\')}}</h1>' +
                '                </div>' +
                '            </div>' +
                '        </div>' +
                '        <div role="tabpanel" ' +
                '             ng-repeat="tab in $tabs track by $index"' +
                '             sx-tab-id="{{tab.id}}"' +
                '             class="tab-wrapper"' +
                '             ng-show="tab.id === activeTab.id">' +
                '        </div>' +
                '    </div>' +
                '</div>' +
                '<style>' +
                '    .nav-tabs>li>a {' +
                '        border: 1px solid #ddd;' +
                '        background-color: #eee;' +
                '    }' +
                '    .nav-tabs>li>a:hover {' +
                '        border: 1px solid #ddd;' +
                '        background-color: #fff;' +
                '    }' +
                '    .nav-close {' +
                '        margin-left: 5px;' +
                '    }' +
                '    .outer {' +
                '        display: table;' +
                '        position: absolute;' +
                '        height: 100%;' +
                '        width: 100%;' +
                '        background: rgba(255, 255, 255, .65);' +
                '    }' +
                '    .middle {' +
                '        display: table-cell;' +
                '        vertical-align: middle;' +
                '    }' +
                '    .inner {' +
                '        text-align: center;' +
                '        margin-left: auto;' +
                '        margin-right: auto; ' +
                '    }' +
                '</style>' +
                '');
        }
    ]);
}());