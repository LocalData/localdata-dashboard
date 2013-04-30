/*jslint nomen: true */
/*globals require: true */

// TODO: Tinypubsub

require.config({
  paths: {
    jquery: 'lib/jquery-1.7.1',
    backbone: 'lib/backbone',
    moment: 'lib/moment.min',
    'lib/kissmetrics': '//doug1izaerwt3.cloudfront.net/' + '1f57015c5e8f46bdc07701e1aa74c6cbdf565383' + '.1',
    'lib/kmq': 'lib/kissmetrics'
  },

  shim: {
    'lib/lodash': {
      exports: '_'
    },

    backbone: {
      deps: ['lib/lodash', 'jquery'],
      exports: 'Backbone'
    },

    'lib/leaflet/leaflet': {
      exports: 'L'
    },

    'lib/leaflet/leaflet.utfgrid': {
      deps: ['lib/leaflet/leaflet'],
      exports: 'L'
    },

    'lib/leaflet.tilejson': {
      deps: ['lib/leaflet/leaflet', 'lib/leaflet/leaflet.utfgrid'],
      exports: 'L'
    },

    'lib/kmq': {
      exports: '_kmq'
    },

    'lib/kissmetrics': {
      deps: ['lib/kmq'],
      exports: '_kmq'
    }

  }

});

require(['jquery', 'lib/lodash', 'backbone', 'app'],
        function ($, _, Backbone, app) {
  'use strict';

  $(document).ready(function () {
    app.initialize();
  });
});
