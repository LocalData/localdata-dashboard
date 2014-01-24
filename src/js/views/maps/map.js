/*jslint nomen: true */
/*globals define: true */

define([
  // Libraries
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/leaflet/leaflet.tilejson',
  'moment',
  'lib/tinypubsub',
  'lib/kissmetrics',

  // LocalData
  'settings'
],

function($, _, Backbone, L, moment, events, _kmq, settings) {
  'use strict';

  /**
   * Creates a standard mapview.
   * Instead of the usual
   *
   */
  var MapView = Backbone.View.extend({
    map: null,

    initialize: function(options) {
      console.log("Init map view");
      _.bindAll(this, 'render');

      this.$el = options.$el;
    },

    render: function() {
      this.$el.height(500);
      // Initialize the map
      // this.map = new L.map(this.$el[0], {
      //   zoom: 15
      // });
      // this.baseLayer = L.tileLayer(settings.baseLayer);
      // this.map.addLayer(this.baseLayer);

      return this.map;
    }
  });

  return MapView;
});
