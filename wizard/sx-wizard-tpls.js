(function() {
    'use strict';

    var module = window.angular.module('sx.wizard.tpls', []);

    module.value('$wizardConsts', {
        template: '$sx-ngtk/wizard/wizard.html'
    });

    module.run(['$templateCache', '$wizardConsts',
        function($templateCache, $wizardConsts) {
            $templateCache.put($wizardConsts.template, '' +
                '<div class="modal-header">' +
                '    <button type="button" class="close" ng-click="cancel()">' +
                '        <span aria-hidden="true">&times;</span>' +
                '    </button>' +
                '    <h3 class="modal-title">{{_title}}</h3>' +
                '</div>' +
                '<div class="modal-body">' +
                '  <div ng-show="_shadow && (_entering || _leaving)" class="shadow">' +
                '    <div class="outer">' +
                '      <div class="middle text-info">' +
                '        <div class="inner">' +
                '          <i class="fa fa-5x fa-spinner fa-pulse"></i>' +
                '        </div>' +
                '        <div class="inner">' +
                '          <h3 ng-show="_entering">loading...</h3>' +
                '          <h3 ng-show="_leaving">validating...</h3>' +
                '        </div>' +
                '      </div>' +
                '    </div>' +
                '  </div>' +
                '  <div class="step-title">{{$current.step.title}}</div>' +
                '  <div class="step-container" ' +
                '       sx-wizard="$data" ' +
                '       sx-wizard-steps="$steps" ' +
                '       sx-wizard-current-step="$current" ' +
                '       sx-wizard-buttons="$buttons" ' +
                '       sx-wizard-show-shadow="showShadow()" ' +
                '       sx-wizard-hide-shadow="hideShadow()" ' +
                '       sx-wizard-init="go(0, false)">' +
                '  </div>' +
                '</div>' +
                '<div class="modal-footer">' +
                '  <div class="btn-group pull-left">' +
                '    <button class="btn btn-default" ' +
                '            ng-repeat="button in $current.step.$context.navigation.buttons"' +
                '            ng-disabled="_entering || _leaving" ' +
                '            ng-click="goById(button.stepFn(), false)">{{button.text}}</button>' +
                '  </div>' +
                '  <div class="btn-group">' +
                '    <button class="btn btn-default" ' +
                '            ng-disabled="_entering || _leaving || _history.length <= 0" ' +
                '            ng-click="previous()">Previous</button>' +
                '    <button class="btn btn-default"' +
                '            ng-show="$stepsOrder.indexOf($current.step.id) < $stepsOrder.length - 1" ' +
                '            ng-disabled="_entering || _leaving" ' +
                '            ng-click="next()">Next</button>' +
                '    <button class="btn btn-default" ' +
                '            ng-show="_showFinishButton" ' +
                '            ng-disabled="_entering || _leaving" ' +
                '            ng-click="success()">Finish</button>' +
                '    <button class="btn btn-default" ng-click="cancel()">Cancel</button>' +
                '  </div>' +
                '</div>' +
                '<style>' +
                '    .modal-dialog {' +
                '        width: 1000px;' +
                '        top: 25px;' +
                '    }' +
                '    .step-container {' +
                '        margin-top: 20px;' +
                '        min-height: 600px;' +
                '        max-height: 600px;' +
                '        overflow-y: auto;' +
                '    }' +
                '    h1 {' +
                '        text-align: left;' +
                '    }' +
                '    .step-title {' +
                '        font-weight: bold;' +
                '    }' +
                '    .shadow {' +
                '        z-index: 1099;' +
                '        left: 0;' +
                '        top: 0;' +
                '        display: block;' +
                '        overflow: hidden;' +
                '        position: absolute;' +
                '        outline: 0;' +
                '        width: 100%;' +
                '        height: 100%;' +
                '        background: rgba(255, 255, 255, .65);' +
                '    }' +
                '    .outer {' +
                '        display: table;' +
                '        position: absolute;' +
                '        height: 100%;' +
                '        width: 100%;' +
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