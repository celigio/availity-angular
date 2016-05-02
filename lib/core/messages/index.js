import angular from 'angular';
import $ from 'jquery';
import _ from 'lodash';

import availity from '../module';
import './constants';

// https://github.com/kylewelsby/angular-post-message/blob/master/src/angular-post-message.js
availity.core.provider('avMessages', function() {

  const enabled = true;

  this.enable = function(value) {

    if (arguments.length) {
      enabled = !!value;
    }

    return enabled;

  }

  this.$get = function($rootScope, $log, AV_MESSAGES) {

    class AvMessages {

      init() {

        const self = this;
        const $window = $(window);

        $window.on(AV_MESSAGES.EVENTS.MESSAGE, function(event) {
          self.onMessage(event);
        });

        $window.on(AV_MESSAGES.EVENTS.RESIZE, function() {
          self.onResize();
        });

        this.send(AV_MESSAGES.EVENTS.AV_MAXIMIZE);

        $rootScope.$on('$destroy', function() {
          self.destroy();
        });

        $window.on(AV_MESSAGES.EVENTS.UNLOAD, function() {
          self.send(AV_MESSAGES.EVENTS.AV_MINIMIZE);
        });

      }

      destroy() {

        $(window).off(AV_MESSAGES.EVENTS.MESSAGE);
        $(window).off(AV_MESSAGES.EVENTS.RESIZE);
        $(window).off(AV_MESSAGES.EVENTS.UNLOAD);

      }

      onResize() {

        const self = this;

        const resize =  _.debounce(function() {

          const height = $('html').height();
          self.send({
            event: AV_MESSAGES.EVENTS.AV_RESIZE,
            height
          });

        }, AV_MESSAGES.RESIZE_DEBOUNCE);

        resize();

      }

      isDomain(url) {

        if (AV_MESSAGES.DOMAIN.test(this.domain())) {
          return AV_MESSAGES.DOMAIN.test(url);
        }

        return AV_MESSAGES.LOCAL.test(url);
      }

      isEnabled() {
        return enabled;
      }

      onMessage(_event) {

        let event = _event;

        event = event.originalEvent || event;  // jQuery wraps in `originalEvent`

        if (!event && !event.data) {
          // no op
          return;
        }

        // don't process messages emitted from same window
        if (event.source === window) {
          return;
        }

        if (!this.isDomain(event.origin)) {
          $log.warn('avMessages rejected a cross domain message since it does not match an *.availity.com  or localhost');
          return;
        }


        var data = event.data;

        try {
          data =  angular.fromJson(data);
        } catch (err) {
          $log.warn('avMessages.onMessage() failed to convert event to json payload');
        }

        if (_.isString(data)) {
          event = data;
          data = null;
        }else {
          event = data.event ? data.event : AV_MESSAGES.AV_RECEIVED;
        }

        $rootScope.$root.$broadcast(event, data);

      }

      isIframe() {
        return window.self !== window.parent;
      }

      domain() {

        const window = root;

        if (window.location.origin) {
          return window.location.origin;
        }

        if (window.location.hostname) {
          return `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;
        }

        return '*';

      }

      send(payload) {

        try {

          const message  = _.isString(payload) ? payload : JSON.stringify(payload);
          this.postMessage(message, this.domain());

        } catch (err) {
          $log.error('avMessages.send() ', err);
        }
      }

      postMessage(message, domain) {
        window.parent.postMessage(message, domain);
      }

    }

    return new AvMessages();

  }

});

availity.core.run(function(avMessages) {

  if (avMessages.isEnabled()) {
    avMessages.init();
  }

});