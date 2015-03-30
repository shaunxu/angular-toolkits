(function (angular) {
    'use strict';
    
    var module = angular.module('sx.message.tpl', []);
    
    module.run(['$templateCache', function ($templateCache) {
      $templateCache.put('__sx-message-tpl/message.html', '' +
        '<div class=\"message-container\">\n' +
        '    <div ng-repeat=\"message in messages\" ng-class=\"getClass(message.type)\" role=\"alert\" id=\"{{message.id}}\">\n' +
        '        <button type=\"button\" class=\"close message-button\" ng-click=\"close(message.id)\" title=\"Close\">\n' +
        '            <i class=\"fa fa-times\"></i>\n' +
        '        </button>\n' +
        '        <button type=\"button\" class=\"close message-button\" ng-show=\"message.details\" ng-click=\"toggleDetails(message)\" title=\"Technical Details\">\n' +
        '            <i class=\"fa fa-question\"></i>\n' +
        '        </button>\n' +
        '        <p><strong>{{message.title}}</strong></p>\n' +
        '        <p ng-show=\"message.contents && message.contents.length > 0\" ng-repeat=\"content in message.contents\">{{content}}</p>\n' +
        '        <div ng-show=\"message.details && message.showDetails\">\n' +
        '            <div class=\"zero-clipboard\"><span class=\"btn-clipboard\" ng-click=\"copy(message.id)\">Copy</span></div>\n' +
        '            <div><pre class=\"message-details\">{{message.details | tryJson}}</pre></div>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '</div>\n' +
        '');
    }]); 

})(window.angular);