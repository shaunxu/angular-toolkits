(function (module) {
    'use strict';

    module.value('uuid', uuid);

    module.provider('$wizard', function () {
        this.$get = [
            '$injector', '$modal',
            function ($injector, $modal) {
                return {
                    open: function (templateUrl, context, success, dismiss) {
                        var rootScope = $injector.get('$rootScope');
                        var scope = rootScope.$new();
                        scope.context = angular.copy(context);

                        var modalInstance = $modal.open({
                            templateUrl: templateUrl,
                            scope: scope
                        });
                        modalInstance.result.then(success || angular.noop, dismiss || angular.noop);
                    },
                    step: function (options) {
                        var directive = {
                            restrict: 'A',
                            require: '^sxWizard',
                            scope: {},
                            link: function (scope, element, attributes, wizardController) {
                                // invoke 'linking' function defined in step if available
                                if (angular.isFunction(options.linking)) {
                                    options.linking(scope, element, attributes, wizardController);
                                }
                                // defaults in scope
                                scope.navigation = scope.navigation || {};
                                scope.entering = scope.entering || function (entered, callback) {
                                    return callback();
                                };
                                scope.leaving = scope.leaving || function (forward, callback) {
                                    return callback(true);
                                };
                                // add step to wizard
                                wizardController.addStep(element, scope);
                                // invoke 'linked' function defined in step if available
                                if (angular.isFunction(options.linked)) {
                                    options.linked(scope, element, attributes, wizardController);
                                }
                            }
                        };
                        return angular.extend(directive, options);
                    }
                };
            }
        ];
    });

    module.directive('sxWizard', ['uuid', 'logger', function (uuid, logger) {
        return {
            restrict: 'A',
            transclude: true,
            templateUrl: 'modules/shared/wizard/wizard.html',
            scope: {},
            controller: ['$scope', function ($scope) {
                var steps = $scope.steps = {};
                var order = $scope.order = [];
                this.addStep = function (element, scope) {
                    // pass context into step's scope
                    scope.context = modalScope.context;
                    // retrieve (or generate if not specified) step id and name
                    var id = element.attr('sx-wizard-step-id');
                    if (!id) {
                        id = uuid.v4();
                        element.attr('sx-wizard-step-id', id);
                    }
                    var name = element.attr('sx-wizard-step-name');
                    if (!name) {
                        name = scope.title + ' (Step ' + (order.length + 1) + ')';
                    }
                    // put step and its order
                    steps[id] = {
                        id: id,
                        title: name,
                        scope: scope,
                        entered: false
                    };
                    order.push(id);
                    // navigate to the first step
                    if (order.length === 1) {
                        $scope.navigate(id, false);
                    }
                };

                var modalInstanceScope = $scope.$parent;
                var modalScope = modalInstanceScope.$parent;
                $scope.close = function () {
                    modalInstanceScope.$dismiss();
                };

                $scope.finish = function () {
                    _invokeStepLeaving($scope.current, true, function (valid) {
                        if (valid) {
                            modalInstanceScope.$close(modalScope.context);
                        }
                    });
                };

                $scope.history = [];
                $scope.current = {};
                $scope.leaving = false;
                $scope.entering = false;
                var _invokeStepLeaving = function (step, forward, callback) {
                    if (step && step.scope && step.scope.leaving) {
                        $scope.leaving = true;
                        step.scope.leaving(forward, function (valid) {
                            $scope.leaving = false;
                            return callback(valid);
                        });
                    }
                    else {
                        $scope.leaving = false;
                        return callback(true);
                    }
                };
                var _invokeStepEntering = function (step) {
                    if (step && step.scope && step.scope.entering) {
                        $scope.entering = true;
                        step.scope.entering(step.entered, function () {
                            step.entered = true;
                            $scope.entering = false;
                        });
                    }
                    else {
                        $scope.entering = false;
                    }
                };
                var _tryGetOrCalculateValue = function (item) {
                    var result = {};
                    if (item) {
                        Object.getOwnPropertyNames(item).forEach(function (name) {
                            var value = item[name];
                            result[name] = angular.isFunction(value) ? value() : value;
                        });
                    }
                    return result;
                };
                $scope.navigate = function (id, shouldPushHistory) {
                    var target = {
                        step: $scope.steps[id],
                        index: $scope.order.indexOf(id)
                    };
                    var current = {
                        step: $scope.current,
                        index: $scope.order.indexOf($scope.current.id)
                    };
                    if (target.step && target.index >= 0) {
                        // determine if it's navigating forward or backward
                        // if there's no step is being shown (current.index < 0) that means forward
                        // then we will invoke current step 'leaving' and target step 'entering' with this value as parameter
                        var forward = (current.index >= 0 && target.index > current.index);
                        _invokeStepLeaving(current.step, forward, function (valid) {
                            if (valid) {
                                // only push the current step in history when it's not from 'previous' function
                                // this is because when navigated previous we should not push into history
                                if (shouldPushHistory && $scope.current.id) {
                                    $scope.history.push($scope.current.id);
                                }
                                // change the current step to point to the target one and invoke 'entering'
                                // this must be executed after push history
                                $scope.current = target.step;
                                _invokeStepEntering($scope.current);
                            }
                        });
                    }
                    else {
                        logger.error('$wizard', 'Failed to navigate due to missing step with id = "' + id + '".', {
                            id: id,
                            target: target,
                            scope: {
                                steps: $scope.steps,
                                order: $scope.order
                            }
                        });
                    }
                };
                $scope.next = function () {
                    var item = _tryGetOrCalculateValue($scope.current.scope.navigation.next);
                    if (item.terminate) {
                        $scope.finish();
                    }
                    else {
                        var id = item.id;
                        // if not defined in step, or failed from step definition
                        // we will find the id of the next step from the order (means the step defined next to this one)
                        // if there's no step currently (indexOf return -1) that means show the first step (indexOf + 1 >> 0)
                        if (!id) {
                            var index = $scope.order.indexOf($scope.current.id) + 1;
                            if (index >= 0 && index <= $scope.order.length - 1) {
                                id = $scope.order[index];
                            }
                            else {
                                logger.error('$wizard', 'Cancel navigate next since it is the last step in wizard.', {
                                    id: id,
                                    index: index,
                                    scope: {
                                        steps: $scope.steps,
                                        order: $scope.order
                                    }
                                });
                            }
                        }
                        if (id) {
                            $scope.navigate(id, true);
                        }
                    }
                };
                $scope.previous = function () {
                    var id = $scope.history.pop();
                    if (id) {
                        $scope.navigate(id, false);
                    }
                };
                $scope.jump = function (navigationItem) {
                    var item = _tryGetOrCalculateValue(navigationItem);
                    if (item.terminate) {
                        $scope.finish();
                    }
                    else {
                        $scope.navigate(item.id, true);
                    }
                };
            }],
            link: function (scope, element, attributes, controllers) {
                scope.modal = (typeof(element.attr('sx-wizard-modal')) !== 'undefined');
                scope.title = element.attr('sx-wizard-title') || 'Anonymous Wizard';

                scope.$watch('current', function (current) {
                    var steps = element.find('.steps-container [sx-wizard-step-id]');
                    angular.forEach(steps, function (step) {
                        var ele = $(step);
                        // convert 'index' to string since attribute value is string
                        // then check if this is the current step we need to switch
                        if (ele.attr('sx-wizard-step-id') === current.id) {
                            ele.show();
                        }
                        else if (ele.is(':visible')) {
                            ele.hide();
                        }
                        else {
                            // nothing need to do on hidden steps
                        }
                    });
                });
            }
        };
    }]);

    module.directive('sxWizardReadOnlyStep', ['$wizard', function ($wizard) {
        return $wizard.step({
            transclude: true,
            template: '<ng-transclude></ng-transclude>'
        });
    }]);
})(angular.module('sx.wizard'));