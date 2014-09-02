/*jslint nomen: true */
/*globals require: true */

// TODO: Tinypubsub

require.config({
  paths: {
    text: 'lib/text',
    jquery: 'lib/jquery-1.7.1',
    backbone: 'lib/backbone',
    d3: 'lib/d3',
    moment: 'lib/moment.min',
    'lib/kissmetrics': '//doug1izaerwt3.cloudfront.net/' + '1f57015c5e8f46bdc07701e1aa74c6cbdf565383' + '.1',
    'lib/kmq': 'lib/kissmetrics',
    cartodb: 'lib/cartodb', //'//libs.cartocdn.com/cartodb.js/v3/cartodb',
    Rickshaw: 'lib/rickshaw'
  },

  shim: {
    'lib/lodash': {
      exports: '_'
    },

    cartodb: {
      deps: ['jquery'],
      exports: 'cartodb'
    },

    Rickshaw: {
      deps: ['d3']
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

    'lib/bootstrap' : ['jquery']
  }

});

require(['jquery', 'lib/lodash', 'loglevel', 'backbone', 'app', 'lib/bootstrap'],
        function ($, _, logLevel, Backbone, app) {
  'use strict';
  console.log("Require ready");

  logLevel('verbose');

  $(document).ready(function () {
    app.initialize();
  });
});
