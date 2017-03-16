import ngModule from '../module';

class AvValContainerController {

  constructor($scope, AV_UI) {
    this.av = { $scope, AV_UI };
  }

  message(context) {

    const { ngModel } = context;

    let message = null;
    const violations = Object.keys(ngModel.$error);
    if (violations.length) {
      const validator = violations[0];
      const constraint = ngModel.$validators[validator] && ngModel.$validators[validator].constraint;
      if (constraint) {
        message = constraint.message;
      } else {
        message = this.av.AV_UI.FALLBACK_VALIDATION_MESSAGE;
      }
    } else {
      message = null;
    }

    // $timeout is needed to update the UI from $broadcast events
    this.av.$scope.$applyAsync(() => {
      this.av.$scope.vm.message = message;
    });

  }


}

ngModule.directive('avValContainer', () => ({
  restrict: 'AE',
  controller: AvValContainerController,
  template: '<p class="help-block" ng-bind="vm.message"></p>',
  replace: true,
  scope: {},

  link(scope) {
    scope.vm = { message: null, id: null };
  }
}));
