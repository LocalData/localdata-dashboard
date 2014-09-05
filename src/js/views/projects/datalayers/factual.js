/*jslint nomen: true */
/*globals define, cartodb, Rickshaw: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/leaflet/leaflet.tilejson',
  'cartodb',
  'Rickshaw',

  // LocalData
  'settings',

  // Router
  'routers/index',

  // Models
  'models/surveys',

  // Views
  'views/surveys',
  'views/map',
  'views/projects/cartoData',

  // Templates
  'text!templates/projects/layerControl.html'
],

function($, _, Backbone, L, cartodb, Rickshaw, settings, IndexRouter, Surveys, SurveyViews, MapView, cdb, template) {
  'use strict';

  cartodb = window.cartodb;

  var LayerControl = Backbone.View.extend({
    template: _.template(template),

    className: 'layer',

    BASEURL: 'https://databucket.herokuapp.com/api/places.geojson?category=123&bbox=',

    events: {
      'click .close': 'close'
    },

    initialize: function(options) {
      _.bindAll(this,
        'setup',
        'render',
        'close',
        'update',
        'getCount',
        'processData',
        'doneLoading'
      );
      this.map = options.map;
      this.setup();
    },

    update: function(options) {
      this.setup();
    },

    /**
     * Set up the map and chart data
     * @param  {Object} options
     */
    setup: function() {
      var bbox = this.map.getBounds().toBBoxString();
      var url = this.BASEURL + bbox;
      console.log("Getting factual data from", url);
      $.get(url)
      .done(this.processData);
    },

    processData: function(data) {
      console.log("Got factual data", data);
      this.data = data;
      this.layer = L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, _.defaults({
            fillColor: '#1d61a1',
            color: '#1d61a1',
            radius: 5,
            weight: 1,
            opacity: 1
          }, settings.circleMarker));
        }
      });
      this.layer.addTo(this.map);
      this.render();
    },

    doneLoading: function() {
      this.$el.find('.loading').hide();
    },

    /**
     * Get the number of responses
     * @return {String}
     */
    getCount: function() {
      if(this.data) {
        return this.data.features.length;
      }
      return '';
    },

    render: function() {
      console.log("Rendering layerControl", this.$el);
      var context = {
        name: 'Businesses via Factual',
        kind: 'businesses',
        meta: {
          count: this.getCount()
        }
      };

      this.$el.html(this.template(context));

      if(this.data) {
        this.doneLoading();
      }

      return this.$el;
    },

    close: function() {
      this.map.removeLayer(this.layer);
      this.remove();
    }
  });

  return LayerControl;

});
