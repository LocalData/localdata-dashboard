/*jslint nomen: true */
/*globals require, define: true */

// TODO: Tinypubsub

require.config({
  paths: {
    text: 'lib/text',
    jquery: 'lib/jquery-1.7.1',
    backbone: 'lib/backbone',
    d3: 'lib/d3.min',
    epoch: 'lib/epoch.0.5.2.min',
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

    epoch: ['d3.global', 'jquery'],

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
    }
  }
});

// Hack to make d3 available to less-sophisticated third-party plugins
// https://github.com/mbostock/d3/issues/1693#issuecomment-35556356
define('d3.global', ['d3'], function(_) {
  d3 = _;
});

require(['jquery', 'lib/lodash', 'loglevel', 'backbone', 'app', 'd3', 'epoch'],
        function ($, _, logLevel, Backbone, app, epoch) {
  'use strict';

  console.log("DO we have d3", epoch);

  logLevel('verbose');

  $(document).ready(function () {
    app.initialize();
  });
});
