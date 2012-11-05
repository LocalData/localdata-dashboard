/*jslint nomen: true */
/*globals require: true */

// TODO: Tinypubsub
//       Google Maps

require.config({
  paths: { 
    jquery: 'http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery',
    backbone: 'lib/backbone',
    moment: 'lib/moment.min'
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

    'lib/leaflet/leaflet.google': {
      deps: ['lib/leaflet/leaflet'],
      exports: 'L'
    }
  },

});

require(['jquery', 'lib/lodash', 'backbone', 'app'],
        function ($, _, Backbone, app) {
  'use strict';

  $(document).ready(function () {
    app.initialize();
  });
});
