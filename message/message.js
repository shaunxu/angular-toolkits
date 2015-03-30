(function (angular) {
    'use strict';
    
    var module = angular.module('sx.message', ['sx.message.tpl']);

    module.value('uuid', uuid);
    module.value('$', $);

    module.provider('$messageOptions', function () {
        this.options = {
            autoHideTimeout: 3000
        };
        this.$get = function () {
            var opts = this.options;
            return opts;
        };
        this.setOptions = function (opts) {
            this.options = (angular.merge || angular.extend)({}, this.options, opts);
        };
    });

    module.factory('$message', ['uuid', '$timeout', '$messageOptions',
        function (uuid, $timeout, $messageOptions) {
            return {
                type: {
                    success: '0',
                    info: '1',
                    warning: '2',
                    error: '3'
                },
                messages: [],
                generateId: function () {
                    return 'sx-message-' + uuid.v4();
                },
                show: function (options) {
                    var self = this;
                    var opts = (angular.merge || angular.extend)({
                        id: self.generateId(),
                        autoHide: false,
                        showDetails: false
                    }, options);
                    self.messages.unshift({
                        id: opts.id,
                        autoHide: opts.autoHide,
                        type: opts.type,
                        title: opts.title,
                        contents: angular.isArray(opts.contents) ? opts.contents : [opts.contents],
                        details: opts.details,
                        showDetails: false
                    });
                    if (opts.autoHide) {
                        $timeout(function () {
                            self.closeById(opts.id);
                        }, $messageOptions.autoHideTimeout);
                    }
                    return {
                        id: opts.id,
                        close: function () {
                            self.closeById(this.id);
                        }
                    };
                },
                error: function (options) {
                    var self = this;
                    options.type = self.type.error;
                    options.autoHide = false;
                    return self.show(options);
                },
                success: function (options) {
                    var self = this;
                    options.type = self.type.success;
                    options.autoHide = true;
                    options.details = null;
                    return self.show(options);
                },
                clear: function () {
                    var self = this;
                    self.messages.forEach(function (msg) {
                      var element = $('#' + msg.id);
                      if (element) {
                          element.alert('close');
                      }
                    });
                    self.messages.length = 0;
                },
                closeAll: function (msgs) {
                    var self = this;
                    if (angular.isArray(msgs)) {
                        msgs.forEach(function (msg) {
                            self.close(msg);
                        });
                        msgs.length = 0;
                    }
                },
                close: function (msg) {
                    this.closeById(msg.id);
                },
                closeById: function (id) {
                    var self = this;
                    var element = $('#' + id);
                    if (element) {
                        element.alert('close');
                    }
                    var i = self.messages.length - 1;
                    while (i >= 0) {
                        if (self.messages[i].id === id) {
                            self.messages.splice(i, 1);
                        }
                        i--;
                    }
                }
            };
        }
    ]);

    module.directive('sxMessageContainer', ['$message', '$', '$document', '$window', '$timeout',
        function ($message, $, $document, $window, $timeout) {
            return {
                restrict: 'A',
                scope: {},
                templateUrl: '__sx-message-tpl/message.html',
                link: function (scope, element, attributes, controllers) {
                    scope.messages = $message.messages;

                    scope.getClass = function (type) {
                        var css = 'alert ';
                        switch (type) {
                            case $message.type.success:
                                css += 'alert-success ';
                                break;
                            case $message.type.warning:
                                css += 'alert-warning ';
                                break;
                            case $message.type.error:
                                css += 'alert-danger ';
                                break;
                            default:
                                css += 'alert-info ';
                                break;
                        }
                        css += 'alert-dismissible fade in';
                        return css;
                    };

                    scope.close = function (id) {
                        $message.closeById(id);
                    };

                    scope.toggleDetails = function (message) {
                        message.showDetails = !message.showDetails;
                    };

                    scope.copy = function (id) {
                        var showToolTip = function (element, content) {
                            element.tooltip({
                                title: content,
                                trigger: 'hover focus'
                            });
                            element.tooltip('show');
                            $timeout(function () {
                                element.tooltip('destroy');
                            }, 3000);
                        };

                        var messageElement = $('#' + id);
                        var range;
                        var selection;
                        var doc = $document[0];
                        if (messageElement) {
                            var preElement = messageElement.find('.message-details');
                            var copyElement = messageElement.find('.btn-clipboard');
                            if (preElement && preElement.length > 0 &&
                                copyElement && copyElement.length > 0) {
                                preElement = preElement[0];
                                if (doc.body.createTextRange) {
                                    range = doc.body.createTextRange();
                                    range.moveToElementText(preElement);
                                    range.select();
                                    showToolTip(copyElement, 'Please press Ctrl+C to copy.');
                                }
                                else if ($window.getSelection) {
                                    selection = $window.getSelection();
                                    range = doc.createRange();
                                    range.selectNodeContents(preElement);
                                    selection.removeAllRanges();
                                    selection.addRange(range);
                                    showToolTip(copyElement, 'Press Ctrl+C to copy.');
                                }
                                else {
                                    showToolTip(copyElement, 'Please select and copy manually due to browser compatibility issue.');
                                }
                            }
                        }
                    };
                }
            };
        }
    ]);
    
    module.filter('tryJson', ['$filter', function ($filter) {
      return function (input) {
        if (angular.isString(input)) {
          return input;
        }
        else {
          return $filter('json')(input);
        }
      };
    }]);
})(window.angular);