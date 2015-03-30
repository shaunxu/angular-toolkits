var app = angular.module('MyApp', [
    'ngNewRouter'
]);

app.run(['$router', function ($router) {
    $router.config([
        {
            path: '/area1',
            component: 'area1'
        },
        {
            path: '/area2',
            component: 'area2'
        },
        {
            path: '/area3',
            component: 'area3'
        },
        {
            path: '/',
            redirectTo: '/area1'
        }
    ]);
}]);