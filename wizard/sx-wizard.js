(function() {
    'use strict';

    var module = window.angular.module('sx.wizard', ['ui.bootstrap', 'sx.wizard.tpls']);

    module.factory('$wizard', ['$q', '$http', '$templateCache', '$uibModal', '$wizardConsts',
        function ($q, $http, $templateCache, $uibModal, $wizardConsts) {

                var _getTemplatePromise = function(step) {
                    if (step.template) {
                        step.template = '<div class="sx-wizard-step" sx-wizard-step-id="' + step.id + '">' + step.template + '</div>';
                        return $q.when(step);
                    }
                    else {
                        return $http.get(step.templateUrl, { cache: $templateCache }).then(function (response) {
                            step.template = '<div class="sx-wizard-step" sx-wizard-step-id="' + step.id + '">' + response.data + '</div>';
                            return step;
                        });
                    }
                };

            return {
                $new: function (opts) {
                    var $wizard = this;
                var wizard = {
                    _steps: {},
                    _stepsOrder: [],
                        _stepTemplatePromises: [],
                    _options: {
                        successing: function($data, $step, $isLastStep, callback) {
                            return callback(true);
                        },
                        size: 'lg',
                        backdrop: 'static',
                        title: 'Wizard',
                        templateUrl: $wizardConsts.template,
                        shadow: true
                    }
                };

                    wizard._options = window.angular.extend({}, wizard._options, opts);

                wizard.addStep = function(step) {
                    var self = this;
                    step.title = step.title || step.id;
                    step.controller = step.controller || window.angular.noop;
                        step.parameters = step.parameters || {};
                    self._steps[step.id] = step;
                    self._stepsOrder.push(step.id);
                        self._stepTemplatePromises.push(_getTemplatePromise(step));
                    return wizard;
                };


                wizard.open = function(data, success, cancel) {
                    var self = this;

                    data = data || {};
                    success = success || window.angular.noop;
                    cancel = cancel || window.angular.noop;

                        $q.all(self._stepTemplatePromises).then(function () {
                        var instance = $uibModal.open({
                            templateUrl: self._options.templateUrl,
                            controller: ['$scope', '$uibModalInstance', '$data', '$steps', '$stepsOrder',
                                function ($scope, $uibModalInstance, $data, $steps, $stepsOrder) {
                                $scope.$data = $data;
                                $scope.$steps = $steps;
                                $scope.$stepsOrder = $stepsOrder;
                                $scope.$current = {};
                                $scope.$uibModalInstance = $uibModalInstance;

                                $scope._title = self._options.title;
                                $scope._history = [];
                                $scope._entering = false;
                                $scope._leaving = false;
                                $scope._shadow = self._options.shadow;

                                $scope.$watch(function() {
                                    if ($scope.$current.step && $scope.$current.step.$context && $scope.$current.index >= 0) {
                                        return $scope.$current.step.$context.navigation.showFinish || ($scope.$current.index >= self._stepsOrder.length - 1);
                                    }
                                    else {
                                        return true;
                                    }
                                }, function(showFinishButton) {
                                    $scope._showFinishButton = showFinishButton;
                                });

                                $scope.success = function() {
                                    $scope._onLeaving(Number.MAX_VALUE, null, function(valid) {
                                        if (valid) {
                                            $scope._leaving = true;
                                            self._options.successing($scope.$data, $scope.$current.step, $scope.$current.index >= self._stepsOrder.length - 1, function(valid) {
                                                $scope._leaving = false;
                                                if (valid) {
                                                    $uibModalInstance.close($scope.$data);
                                                }
                                            });
                                        }
                                    });
                                };

                                $scope.cancel = function() {
                                    $uibModalInstance.dismiss();
                                };

                                $scope._onLeaving = function(toIndex, toStep, callback) {
                                    // current step might be "undefined" when wizard was shown firstly
                                    if ($scope.$current.step) {
                                        var leaving = $scope.$current.step.$context.behavior.leaving;
                                        var options = {
                                            toStepId: toStep && toStep.id,
                                            forward: $scope.$current.index <= toIndex
                                        };
                                        $scope._leaving = true;
                                        leaving.apply($scope.$current.step.$controller, [options,
                                            function(valid) {
                                                $scope._leaving = false;
                                                return callback(valid);
                                            }
                                        ]);
                                    }
                                    else {
                                        return callback(true);
                                    }
                                };

                                $scope._onEntering = function(fromIndex, fromStep, callback) {
                                    var entering = $scope.$current.step.$context.behavior.entering;
                                    var options = {
                                        fromStepId: fromStep && fromStep.id,
                                        forward: fromIndex <= $scope.$current.index,
                                        entered: $scope.$current.step.entered || false
                                    };
                                    $scope._entering = true;
                                    entering.apply($scope.$current.step.$controller, [options,
                                        function() {
                                            $scope._entering = false;
                                            $scope.$current.step.entered = true;
                                            return callback();
                                        }
                                    ]);
                                };

                                $scope.goById = function(stepOrId, isPrevious) {
                                    var id = window.angular.isString(stepOrId) ? stepOrId : (stepOrId && stepOrId.id);
                                            if (id === $wizard.$constants.finishStepId) {
                                            $scope.success();
                                        }
                                        else {
	                                    var step = self._steps[id];
	                                    if (step) {
	                                        var index = self._stepsOrder.indexOf(id);
	                                        if (index >= 0) {
	                                            $scope._onLeaving(index, step, function(valid) {
	                                                if (valid) {
	                                                    var fromIndex = $scope.$current.index || -1;
	                                                    var fromStepId = $scope.$current.step && $scope.$current.step.id;
	                                                    // if it is came from previous step and contains history then pop
	                                                    if (isPrevious && $scope._history.length > 0) {
	                                                        $scope._history.pop();
	                                                    }
	                                                    // if it is not came from previous step and has current step then push current into history
	                                                    if (!isPrevious && $scope.$current.step) {
	                                                        $scope._history.push($scope.$current.step.id);
	                                                    }
	                                                    // navigate
	                                                    $scope.$current.index = index;
	                                                    $scope.$current.step = step;
	                                                    $scope._onEntering(fromIndex, self._steps[fromStepId], function() {
	                                                        $scope._showFinishButton = ($scope.$current.index >= self._stepsOrder.length - 1);
	                                                    });
	                                                }
	                                            });
	                                        }
	                                    }
                                        }
                                };

                                $scope.go = function(index, isPrevious) {
                                    if (index >= 0 && index <= self._stepsOrder.length - 1) {
                                        var id = self._stepsOrder[index];
                                        $scope.goById(id, isPrevious);
                                    }
                                };

                                $scope.next = function() {
                                    var nextStepId = $scope.$current.step.$context.navigation.nextStepId;
                                    if (nextStepId) {
                                        $scope.goById(nextStepId, false);
                                    }
                                    else {
                                        $scope.go($scope.$current.index + 1, false);
                                    }
                                };

                                $scope.previous = function() {
                                    if ($scope._history.length > 0) {
                                        // do not pop from history right now
                                        // pop it when validation passed 
                                        $scope.goById($scope._history[$scope._history.length - 1], true);
                                    }
                                };
                                        $scope.showShadow = function (isLeaving) {
                                            if (isLeaving) {
                                                $scope._leaving = true;
                                            }
                                            else {
                                                $scope._entering = true;
                                            }
                                        };
                                        $scope.hideShadow = function () {
                                            $scope._leaving = false;
                                            $scope._entering = false;
                                        };
                                }
                            ],
                            size: self._options.size,
                            resolve: {
                                $data: function() {
                                    return window.angular.copy(data);
                                },
                                $steps: function() {
                                    return self._steps;
                                },
                                $stepsOrder: function() {
                                    return self._stepsOrder;
                                }
                            },
                            backdrop: self._options.backdrop
                        });
                        instance.result.then(function(data) {
                            return success(data);
                        }, function() {
                            return cancel();
                        });
                    });
                };

                return wizard;
                },
                $constants: {
                    finishStepId: '$$finish'
                }
            };
        }
    ]);

    module.directive('sxWizard', ['$compile', '$controller',
        function($compile, $controller) {
            return {
                scope: {
                    $data: '=sxWizard',
                    $steps: '=sxWizardSteps',
                    $current: '=sxWizardCurrentStep',
                    $init: '&sxWizardInit',
                    $showShadow: '&sxWizardShowShadow',
                    $hideShadow: '&sxWizardHideShadow'
                },
                link: function(scope, element, attributes, controllers) {
                    var _stepElements = [];
                    var _steps = {};
                    window.angular.forEach(scope.$steps, function(step, id) {
                        _steps[id] = {
                            id: id,
                            title: step.title
                        };
                    });

                    window.angular.forEach(scope.$steps, function(step, id) {
                        var template = step.template;
                        var controller = step.controller;
                        var templateScope = scope.$new();
                        templateScope.$context = {
                            data: scope.$data,
                            parameters: step.parameters,
                            steps: _steps,
                            currentStepId: scope.$current.step && scope.$current.step.id,
                            navigation: {
                                showFinish: false,
                                nextStepId: null,
                                buttons: []
                            },
                            behavior: {
                                shadow: function (isLeaving, fn) {
                                    try {
                                        scope.$showShadow(isLeaving);
                                        return fn(function () {
                                            scope.$hideShadow();
                                        });
                                    }
                                    catch (_) {
                                        scope.$hideShadow();
                                    }
                                },
                                entering: function(options, callback) {
                                    return callback();
                                },
                                leaving: function(options, callback) {
                                    return callback(true);
                                }
                            }
                        };
                        step.$controller = $controller(controller, {
                            $scope: templateScope
                        });
                        step.$context = templateScope.$context;
                        step.entered = false;
                        element.append(template);
                        var templateElement = element.find('[sx-wizard-step-id="' + id + '"]');
                        $compile(templateElement.contents())(templateScope);
                        _stepElements.push(templateElement);
                    });

                    scope.$watch('$current.step', function(step) {
                        if (step) {
                            window.angular.forEach(_stepElements, function(stepElement) {
                                if (stepElement.attr('sx-wizard-step-id') === step.id) {
                                    stepElement.show();
                                }
                                else {
                                    stepElement.hide();
                                }
                            });
                        }
                    });

                    scope.$init();
                }
            };
        }
    ]);

}());
