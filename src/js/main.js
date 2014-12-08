/*jslint nomen: true */
/*globals require, define: true */

// TODO: Tinypubsub

require.config({
  paths: {
    text: 'lib/text',
    jquery: 'lib/jquery-1.7.1',
    backbone: 'lib/backbone',
    Chart: 'lib/Chart',
    d3: 'lib/d3.min',
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

    'lib/leaflet.draw/leaflet.draw': {
      deps: ['lib/leaflet/leaflet'],
      exports: 'L'
    },

    'lib/leaflet/leaflet.tilejson': {
      deps: ['lib/leaflet/leaflet', 'lib/leaflet/leaflet.utfgrid'],
      exports: 'L'
    },

    'lib/kmq': {
      exports: '_kmq'
    },

    'lib/kissmetrics': {
      deps: ['lib/kmq'],
      exports: '_kmq'
    },

    'lib/c3': {
      deps: ['d3'],
      exports: 'c3'
    }
  }
});


require(['jquery', 'lib/lodash', 'loglevel', 'backbone', 'app'],
        function ($, _, logLevel, Backbone, app, epoch) {
  'use strict';

  logLevel('verbose');

  $(document).ready(function () {
    app.initialize();
  });
});
