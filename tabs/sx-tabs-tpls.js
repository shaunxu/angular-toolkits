(function() {
    'use strict';

    var module = window.angular.module('sx.tabs.tpls', []);

    module.value('$tabsConsts', {
        template: '$sx-ngtk/tabs/tabs.html'
    });

    module.run(['$templateCache', '$tabsConsts',
        function($templateCache, $tabsConsts) {
            $templateCache.put($tabsConsts.template,
                '<div role="tabpanel" class="sx-tabs">' +
                '    <ul class="nav nav-tabs sx-tabs-navigation">' +
                '        <li role="presentation" ' +
                '            ng-repeat="tab in $tabsOrder track by $index"' +
                '            ng-class="$tabs[tab.id].id === activeTab.id ? \'active\' : \'\'"' +
                '            ng-show="$tabs[tab.id].enabled"' +
                '            sx-tab-nav-id="{{$tabs[tab.id].id}}">' +
                '            <a href="javascript:void(0)" ng-click="switchTab({e: $event, id: $tabs[tab.id].id, byTabDisabled: false}, window.angular.noop)"><button class="close nav-close" type="button" ng-click="disableTab($event, tab.id)">×</button>{{$tabs[tab.id].title}}</a> ' +
                '        </li>' +
                '        <li class="sx-tabs-nav-plus" ng-show="showTabsPlusIcon">' +
                '            <a class="dropdown-toggle" style="cursor: pointer;" data-toggle="dropdown">' +
                '                <span class="glyphicon glyphicon-plus"></span>' +
                '            </a>' +
                '            <ul class="dropdown-menu" role="menu">' +
                '                <li ng-repeat="tab in $tabsOrder track by $index">' +
                '                    <a ng-click="enableTab($tabs[tab.id].id, $index)" ng-hide="$tabs[tab.id].enabled" href="javascript:void(0)">{{$tabs[tab.id].title}}</a>' +
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
                '             ng-repeat="tab in $tabsOrder track by $index"' +
                '             sx-tab-id="{{$tabs[tab.id].id}}"' +
                '             class="tab-wrapper"' +
                '             ng-show="$tabs[tab.id].id === activeTab.id">' +
                '        </div>' +
                '    </div>' +
                '</div>' +
                '<pre>{{$tabsOrder | json}}</pre>' +
                '<pre>{{$tabs | json}}</pre>' +
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
                '</style>'
            );
        }
    ]);
}());