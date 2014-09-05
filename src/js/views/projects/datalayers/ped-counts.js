/*jslint nomen: true */
/*globals define, cartodb, Rickshaw: true */

define(function (require) {
  'use strict';

  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');
  var L = require('lib/leaflet/leaflet.tilejson');
  var settings = require('settings');

  // Templates
  var template = require('text!templates/projects/layerControl.html');

  var LayerControl = Backbone.View.extend({
    template: _.template(template),

    className: 'layer',

    initialize: function(options) {
      _.bindAll(this,
        'setup',
        'render',
        'update',
        'getCount',
        'processData',
        'doneLoading'
      );
      this.map = options.map;
      this.clickHandler = options.clickHandler;
      this.setup();
    },

    update: function(options) {
      //this.setup();
    },

    /**
     * Set up the map and chart data
     * @param  {Object} options
     */
    setup: function() {
      var self = this;
      setTimeout(function () {
        self.processData();
      }, 0);
      //$.ajax({
      //  url: '//comfortless.herokuapp.com/?url=' + encodeURIComponent('https://s3.amazonaws.com/localdata-public/misc/tmp/ftraffic.geojson'),
      //  dataType: 'json'
      //}).done(function (data) {
      //  self.processData(data);
      //}).fail(function (error) {
      //  console.log(error);
      //});
    },

    processData: function(data) {
      data = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          id: 0,
          geometry: {
            type: 'Point',
            coordinates: [-122.39039897918701, 37.77699026677441]
          },
          properties: {
            counts: []
          }
        }, {
          type: 'Feature',
          id: 0,
          geometry: {
            type: 'Point',
            coordinates: [-122.38958358764648, 37.77247872458732]
          },
          properties: {
            counts: []
          }
        }, {
          type: 'Feature',
          id: 0,
          geometry: {
            type: 'Point',
            coordinates: [-122.39683628082275, 37.770307658806495]
          },
          properties: {
            counts: []
          }
        }, {
          type: 'Feature',
          id: 0,
          geometry: {
            type: 'Point',
            coordinates: [-122.38936901092531, 37.766202813376644]
          },
          properties: {
            counts: []
          }
        }, {
          type: 'Feature',
          id: 0,
          geometry: {
            type: 'Point',
            coordinates: [-122.3939609527588, 37.766643840752764]
          },
          properties: {
            counts: []
          }
        }]
      };
      this.data = data;
      var self = this;

      this.layer = L.geoJson(this.data, {
        pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, _.defaults({
            fillColor: '#14f',
            radius: 8
          }, settings.circleMarker));
        },
        onEachFeature: function (feature, layer) {
          self.clickHandler(feature.properties.counts);
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
        name: 'Traffic data',
        kind: 'traffic',
        meta: {
          // count: this.getCount()
        }
      };

      this.$el.html(this.template(context));

      if(this.data) {
        this.doneLoading();
      }

      return this.$el;
    }
  });

  return LayerControl;

});
