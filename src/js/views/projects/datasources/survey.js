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
    initialize: function(options) {
      _.bindAll(this, 'setup', 'render', 'update', 'processData', 'getTileJSON', 'addTileLayer');
      console.log("Creating survey layer with options", options);
      this.map = options.map;
      this.surveyId = options.layerId;

      this.survey = new Surveys.Model({ id: this.surveyId });
      this.survey.on('change', this.processData);
      this.survey.fetch();
      this.setup();
    },

    update: function(options) {
      this.survey.fetch();
    },

    /**
     * Set up the map and chart data
     * @param  {Object} options
     */
    setup: function() {
    },

    processData: function(data) {
      console.log("Got survey data", data);
      this.render();

      this.map.survey = this.survey;
      this.getTileJSON();
      // TODO-- add tile layer
      // this.data = data;
      // this.layer = L.geoJson(data, {
      //   pointToLayer: function (feature, latlng) {
      //     return L.circleMarker(latlng, settings.circleMarker);
      //   }
      // });
      // this.layer.addTo(this.map);
      // this.render();
    },

    getTileJSON: function() {
      var url = '/tiles/' + this.survey.get('id');
      url = url + '/tile.json';

      console.log("Getting tilejson", url);
      // Get TileJSON
      $.ajax({
        url: url,
        type: 'GET',
        dataType: 'json',
        cache: false
      }).done(this.addTileLayer)
      .fail(function(jqXHR, textStatus, errorThrown) {
        console.log("Error fetching tilejson", jqXHR, textStatus, errorThrown);
      });
    },

    addTileLayer: function(tilejson) {
      this.tileLayer = new L.TileJSON.createTileLayer(tilejson);
      this.map.addLayer(this.tileLayer);
    },

    render: function() {
      console.log("Rendering layerControl", this.$el);
      var context = {
        name: this.survey.get('name') || 'LocalData Survey',
        kind: 'responses',
        meta: {}
      };

      // Show a count
      if(this.survey.get('count')) {
        context.meta.count = this.survey.get('count');
      }

      this.$el.html(this.template(context));
      return this.$el;
    }
  });

  return LayerControl;

});
