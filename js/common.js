/*jslint nomen: true */
/*globals require: true */

//The build will inline common dependencies into this file.

// TODO: Tinypubsub

require.config({
  baseUrl: 'js',
  paths: {
    jquery: 'lib/jquery-1.7.1',
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
  }
});
