import angular from 'angular';
import ngModule from '../module';

ngModule.directive('avTooltip', () => {
  return {
    restrict: 'A',
    controller: 'AvTooltipController',
    scope: {
      show: '=',
      delay: '='
    },
    link(scope, element, attrs, avTooltip) {

      const options = {};

      scope.$evalAsync(() => {
        element.tooltip(angular.extend({}, options, {
          html: true
        }));
        avTooltip.init();
      });

    }
  };
});


