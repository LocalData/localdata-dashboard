/*jslint nomen: true */
/*globals require: true */

// TODO: Tinypubsub

require.config({
  paths: {
    d3: "lib/d3.v3.min",
    text: 'lib/text',
    jquery: 'lib/jquery-1.7.1',
    backbone: 'lib/backbone',
    intercom: 'lib/intercom',
    moment: 'lib/moment.min',
    pikaday: 'lib/pikaday.min'
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

    'lib/leaflet.draw/leaflet.draw': {
      deps: ['lib/leaflet/leaflet'],
      exports: 'L'
    },

    'lib/leaflet/leaflet.tilejson': {
      deps: ['lib/leaflet/leaflet', 'lib/leaflet/leaflet.utfgrid'],
      exports: 'L'
    },

    'lib/bootstrap' : ['jquery'],
    'lib/c3': {
      deps: ['d3'],
      exports: 'c3'
    },

    'pikaday': {
      deps: ['moment']
    }
  }

});

require(['jquery', 'lib/lodash', 'loglevel', 'backbone', 'app', 'lib/bootstrap', 'lib/jquery.cookie', 'lib/intercom'],
        function ($, _, logLevel, Backbone, app) {
  'use strict';

  logLevel('verbose');

  $(document).ready(function () {
    app.initialize();
  });
});
