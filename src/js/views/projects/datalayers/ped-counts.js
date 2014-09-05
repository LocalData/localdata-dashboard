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
            counts: [19, 15, 18, 40, 96, 176, 210, 244, 274, 293, 307, 312, 298, 318,  457, 430, 442, 391, 354, 307, 238, 139, 71, 38 ]
          }
        }, {
          type: 'Feature',
          id: 0,
          geometry: {
            type: 'Point',
            coordinates: [-122.38958358764648, 37.77247872458732]
          },
          properties: {
            counts: [15, 12, 19, 45, 104, 175, 212, 228, 238, 282, 315, 312, 289, 289,  316, 354, 426, 440, 364, 304, 205, 123, 61, 31 ]
          }
        }, {
          type: 'Feature',
          id: 0,
          geometry: {
            type: 'Point',
            coordinates: [-122.39683628082275, 37.770307658806495]
          },
          properties: {
            counts: [18, 13, 24, 47, 123, 205, 256, 296, 314, 305, 340, 394, 350, 350,  315, 350, 386, 410, 344, 316, 211, 125, 64, 41 ]
          }
        }, {
          type: 'Feature',
          id: 0,
          geometry: {
            type: 'Point',
            coordinates: [-122.38936901092531, 37.766202813376644]
          },
          properties: {
            counts: [47, 26, 16, 24, 70, 150, 213, 294, 350, 408, 470, 491, 481, 441,  507, 516, 542, 503, 447, 393, 357, 248, 147, 85 ]
          }
        }, {
          type: 'Feature',
          id: 0,
          geometry: {
            type: 'Point',
            coordinates: [-122.3939609527588, 37.766643840752764]
          },
          properties: {
            counts: [28, 13, 10, 17, 42, 109, 178, 189, 213, 236, 263, 269, 288, 266, 283,  331, 354, 407, 373, 312, 271, 188, 116, 59 ]
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
          layer.on('click', function () {
            self.clickHandler(feature.properties.counts);
          });
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
        name: 'Pedestrian counts',
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
    },

    close: function() {
      this.map.removeLayer(this.layer);
      this.remove();
    }
  });

  return LayerControl;

});
