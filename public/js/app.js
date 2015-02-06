(function () {
    "use srict";
    angular.module('jolokiaApp', [])
      .controller('HostListController', function($scope, $http, $rootScope) {
          $http.get('/api/servers').success(function (dat) {
              $scope.servers = dat;
          }).error(function () {
              alert("Cannot get server list");
          });
          $scope.showServer = function (artifact, phase, server) {
              $rootScope.$emit('showServer', artifact,phase,server);
          };
      })
      .controller('CategoryListController', function($scope, $http, $rootScope) {
          $rootScope.$on('showServer', function (event, artifact, phase, server) {
              $scope.artifact = artifact;
              $scope.phase = phase;
              $scope.host = server['host'];
              var path = '/api/list/' + artifact + '/' + phase + '/' + server['host'];
              $http.get(path).success(
                  function (dat) {
                    $scope.list = dat;
                }
              ).error(function () {
                  alert("Cannot get beans list: " + path);
              });
          });

          $scope.showBean = function (artifact,phase,host,klass,type, opInfo) {
              $rootScope.$emit('showBean', artifact,phase,host,klass,type, opInfo);
          };
      })
      .controller('BeanController', function($scope, $http, $rootScope) {
          $rootScope.$on('showBean', function (event, artifact, phase, host,klass,type, opInfo) {
              $scope.artifact = artifact;
              $scope.phase = phase;
              $scope.host = host;
              $scope.klass = klass;
              $scope.type = type;
              $scope.opInfo = opInfo;

              $scope.args = {};
              var keys = Object.keys(opInfo);
              for (var i=0,l=keys.length; i<l; i++) {
                  $scope.args[keys[i]] = [];
              }

              var path = '/api/read/' + artifact + '/' + phase + '/' +host + '/' + encodeURIComponent(klass) + '/' + encodeURIComponent(type);
              $http.get(path).success(
                  function (dat) {
                    $scope.dat = dat;
                }
              );
          });

          $scope.execute = function (opName, opDetail) {
              var path = '/api/exec/' + $scope.artifact + '/' + $scope.phase + '/' + $scope.host + '/' + encodeURIComponent($scope.klass) + '/' + encodeURIComponent($scope.type) + "?" + (new Date()).getTime();
              $scope.status = "Accessing to " + path;
              var data = {
                  opName: opName,
                  args: $scope.args[opName]
              };
              console.log(path);
              console.log(data);
              $http.post(path, data).success(function (dat) {
                  alert(JSON.stringify(dat.value));
                $scope.status = "OK: " + path;
              }).error(function (dat) {
                  alert("Error: " + dat);
              });
              console.log($scope.args);
          };
      });
})();
