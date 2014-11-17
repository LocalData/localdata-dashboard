/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  // Libs
  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');
  var L = require('lib/leaflet/leaflet.tilejson');
  var moment = require('moment');

  // LD
  var settings = require('settings');

  /**
   * Creates a standard mapview.
   * Instead of the usual
   *
   */
  var MapView = Backbone.View.extend({
    map: null,

    initialize: function(options) {
      console.log("Init map view", options);
      _.bindAll(this, 'render');

      this.$el = options.$el;
    },

    render: function() {
      // Initialize the map
      this.map = new L.map(this.$el[0], {
        zoom: 15,
        center: [42.331427,-83.045754]
      });
      this.baseLayer = L.tileLayer(settings.baseLayer);
      this.map.addLayer(this.baseLayer);

      return this.map;
    }
  });

  return MapView;
});
