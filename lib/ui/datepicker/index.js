import angular from 'angular';
import $ from 'jquery';
import moment from 'moment';
import _ from 'lodash';

import availity from '../module';

availity.ui.provider('avDatepickerConfig', function() {

  const config = {
    autoclose: true,
    todayHighlight: true,
    format: 'mm/dd/yyyy',
    forceParse: false
  };

  this.set = function(options) {
    angular.extend(config, options);
  };

  this.$get = function() {
    return angular.copy(config);
  };

});

// Options: http://bootstrap-datepicker.readthedocs.org/en/latest/options.html
availity.ui.constant('AV_DATEPICKER', {
  CONTROLLER: '$ngModelController',
  ADD_ON_SELECTOR: '[data-toggle="datepicker"]',
  OPTIONS: [
    'autoclose',
    'beforeShowDay',
    'beforeShowMonth',
    'calendarWeeks',
    'clearBtn',
    'toggleActive',
    'container',
    'daysOfWeekDisabled',
    'datesDisabled',
    'defaultViewDate',
    'endDate',
    'forceParse',
    'format',
    'inputs',
    'keyboardNavigation',
    'language',
    'minViewMode',
    'multidate',
    'multidateSeparator',
    'orientation',
    'startDate',
    'startView',
    'todayBtn',
    'todayHighlight',
    'weekStart',
    'showOnFocus',
    'disableTouchKeyboard',
    'enableOnReadonly',
    'modelFormat'
  ],
  DEFAULTS: {
    MODELFORMAT: 'YYYY-MM-DD'
  }
});

// Inspiration https://github.com/mgcrea/angular-strap/blob/v0.7.8/src/directives/datepicker.js
availity.ui.controller('AvDatepickerController', function($element, $attrs, AV_DATEPICKER, $scope, avDatepickerConfig) {

  const self = this;
  this.options = {};

  this.setValue = function() {

    const viewValue = self.ngModel.$viewValue;
    const plugin = this.plugin();

    if (!viewValue || !plugin) {
      return;
    }

    plugin.setDate(viewValue);
  };

  this.setNgModel = function(ngModel) {
    this.ngModel = ngModel;
  };

  this.findModel = function() {

    const ngModel = null;

    const $input = $element.find('input:first').andSelf();
    if ($input.length) {
      ngModel = $input.data(AV_DATEPICKER.CONTROLLER);
      this.setNgModel(ngModel);
    }

    return ngModel;
  };

  this.modelToView = function(isoWrap) {
    const viewValue = $.fn.datepicker.DPGlobal.formatDate(isoWrap, self.options.format, 'en');
    return viewValue;
  };

  this.wrapIsoDate = function() {

    const date = self.ngModel.$modelValue;
    const isoWrap;

    if (date !== undefined && date !== null) {
      const m = moment(date);
      isoWrap = m.isValid() ? m.toDate() : null;
    }

    return isoWrap;
  };

  this.viewToModel = function() {

    const plugin = self.plugin();

    if (!plugin) {
      return null;
    }

    const format = $.fn.datepicker.DPGlobal.parseFormat(self.options.format);
    const utcDate = $.fn.datepicker.DPGlobal.parseDate(self.ngModel.$viewValue, format, 'en');

    // jscs: disable
    const localDate = plugin._utc_to_local(utcDate);
    // jscs: enable

    if (self.options.modelFormat && localDate) {
      localDate = moment(localDate).format(self.options.modelFormat);
    }

    return localDate;
  };

  this.init = function() {

    self.options = angular.extend({}, avDatepickerConfig);

    _.forEach($attrs, function(value, key) {
      if (_.contains(AV_DATEPICKER.OPTIONS, key.replace('data-', ''))) {
        self.options[key] = $scope.$eval(value);
      }
    });

    if (self.options.modelFormat && self.options.modelFormat.toLowerCase() === 'default') {
      self.options.modelFormat = AV_DATEPICKER.DEFAULTS.MODELFORMAT;
    }
  };

  this.plugin = function() {
    return $element.data('datepicker');
  };

  this.destroy = function() {
    var plugin = this.plugin();
    if (plugin) {
      plugin.remove();
      $element.data('datepicker', null);
    }
  };

  this.hide = function() {
    var plugin = this.plugin();
    if (plugin) {
      plugin.hide();
    }
  };
});

availity.ui.directive('avDatepicker', function($window, $log, AV_DATEPICKER) {
  return {
    restrict: 'A',
    require: ['ngModel', 'avDatepicker'],
    controller: 'AvDatepickerController',
    link: function(scope, element, attrs, controllers) {

      var ngModel = controllers[0];
      var avDatepicker = controllers[1];

      if (!ngModel) {
        ngModel = avDatepicker.findModel();
        if (!ngModel) {
          $log.error('avDatepicker requires ngModel');
          return;
        }
      }

      avDatepicker.init();
      avDatepicker.setNgModel(ngModel);

      element.on('changeDate', function(e) {
        $log.info('avDatepicker changeDate {0}', [e]);
      });

      // (view to model)
      ngModel.$parsers.push(avDatepicker.viewToModel);

      // (model to view) - added to end of formatters array
      // because they are processed in reverse order.
      // if the model is in Date format and send to the validation framework
      // prior to getting converted to the expected $viewValue format,
      // the validation will fail.
      ngModel.$formatters.push(avDatepicker.modelToView);
      ngModel.$formatters.push(avDatepicker.wrapIsoDate);

      var _$render = ngModel.$render;
      ngModel.$render = function() {
        _$render();
        avDatepicker.setValue();
      };

      var win = angular.element($window);

      win.bind('scroll', function() {
        avDatepicker.hide();
      });

      var target = element.siblings(AV_DATEPICKER.ADD_ON_SELECTOR);
      if (target.length) {
        target.on('click.datepicker', function() {
          if (!element.prop('disabled')) { // Hack check for IE 8
            element.focus();
          }
        });
      }

      scope.$on('destroy', function() {
        avDatepicker.destroy();
        if (target.length) {
          target.off('click.datepicker');
        }
      });

      scope.$evalAsync(function() {
        element.datepicker(avDatepicker.options);
      });
    }
  };
});
