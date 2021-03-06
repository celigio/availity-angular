/* global describe, it, beforeEach, expect, module*/

import angular from 'angular';

import Tester from 'tester';
import '../';

import fixtures from './fixtures';

describe('avDropdown', () => {

  let $el;
  const tester = new Tester();

  beforeEach(() => {
    angular.mock.module('availity');
    angular.mock.module('availity.ui');
  });

  beforeEach(angular.mock.module(avDropdownConfigProvider => {

    avDropdownConfigProvider.set({
      width: 100,
      minimumInputLength: 5
    });

  }));


  tester.directive();

  it('should create DOM structure', () => {
    $el = tester.compileDirective(fixtures.standard);
    tester.flush();
    expect($el.siblings().is('div.select2-container')).toBe(true);
  });

  describe('AvDropdownController', () => {

    it('should default options when supplied', () => {

      $el = tester.compileDirective(fixtures.standard);

      expect($el.data('$avDropdownController').options.width).toBe(100);
      expect($el.data('$avDropdownController').options.minimumInputLength).toBe(5);
    });


    it('should use attribute values over default values', () => {

      $el = tester.compileDirective(fixtures.query);

      expect($el.data('$avDropdownController').options.minimumInputLength).toBe(0);
    });

  });

  describe('$ngModelController', () => {

    it('should be $pristine on load', () => {

      tester.$scope.demo = {};
      tester.$scope.demo.selections = ['first', 'second', 'third'];
      tester.$scope.demo.selected = 1;

      $el = tester.compileDirective(fixtures.standard);
      tester.flush();

      expect($el.data('$ngModelController').$pristine).toBe(true);

      // this should update the model and control state. this test is here
      // just to demonstrate the behavior and refresh our memory
      $el.trigger('change');

      expect($el.data('$ngModelController').$pristine).toBe(false);
      expect($el.data('$ngModelController').$dirty).toBe(true);

    });

  });

  describe('models', () => {

    it('should update when type is array', () => {

      tester.$scope.demo = {};
      tester.$scope.demo.selections = ['first', 'second', 'third'];
      tester.$scope.demo.selected = 'first';

      $el = tester.compileDirective(fixtures.standard);

      tester.flush();

      tester.$scope.demo.selected = 'second';
      tester.$scope.$apply();
      tester.flush();
      expect($el.select2('val')).toBe('string:second');

    });

    it('should update when types are objects', () => {

      tester.$scope.demo = {};
      tester.$scope.demo.selections = [
        {
          id: 1,
          value: 'first'
        },
        {
          id: 2,
          value: 'second'
        },
        {
          id: 3,
          value: 'third'
        }
      ];
      tester.$scope.demo.selected = tester.$scope.demo.selections[0];

      $el = tester.compileDirective(fixtures.objects);

      tester.flush();

      tester.$scope.demo.selected = tester.$scope.demo.selections[0];
      tester.$scope.$apply();
      tester.flush();

      // Angular adds a property called $$hashkey to objects in order to track them in a collection.
      //
      //  @see https://github.com/angular/angular.js/blob/ddb4ef13a9793b93280e6b5ab2e0593af1c04743/src/ng/directive/ngOptions.js#L282.
      //  @see https://github.com/angular/angular.js/blob/07849779ba365f371a8caa3b58e23f677cfdc5ad/src/apis.js#L28
      //
      // We use the same method here to get the key and compare it so the value in Select2.
      expect($el.select2('val')).toBe(tester.$scope.demo.selections[0].$$hashKey);

    });

  });

});
