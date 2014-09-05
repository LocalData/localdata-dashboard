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
            coordinates: [-122.38986253738403, 37.77515854600097]
          },
          properties: {
            counts: [ 507, 516, 542, 503, 447, 393, 357, 248, 147, 85, 47, 26, 16, 24, 70, 150, 213, 294, 350, 408, 470, 491, 481, 441 ]
          }
        }, {
          type: 'Feature',
          id: 0,
          geometry: {
            type: 'Point',
            coordinates: [-122.4017071723938, 37.77173242791533]
          },
          properties: {
            counts: [ 457, 430, 442, 391, 354, 307, 238, 139, 71, 38, 19, 15, 18, 40, 96, 176, 210, 244, 274, 293, 307, 312, 298, 318]
          }
        }, {
          type: 'Feature',
          id: 0,
          geometry: {
            type: 'Point',
            coordinates: [-122.39683628082275, 37.76642332739345]
          },
          properties: {
            counts: [ 331, 354, 407, 373, 312, 271, 188, 116, 59, 28, 13, 10, 17, 42, 109, 178, 189, 213, 236, 263, 269, 288, 266, 283 ]
          }
        }, {
          type: 'Feature',
          id: 0,
          geometry: {
            type: 'Point',
            coordinates: [-122.38904714584352, 37.76696612832592]
          },
          properties: {
            counts: [ 316, 354, 426, 440, 364, 304, 205, 123, 61, 31, 15, 12, 19, 45, 104, 175, 212, 228, 238, 282, 315, 312, 289, 289 ]
          }
        }, {
          type: 'Feature',
          id: 0,
          geometry: {
            type: 'Point',
            coordinates: [-122.39091396331787, 37.77729554915761]
          },
          properties: {
            counts: [ 315, 350, 386, 410, 344, 316, 211, 125, 64, 41, 18, 13, 24, 47, 123, 205, 256, 296, 314, 305, 340, 394, 350, 350 ]
          }
        }]
      };
      this.data = data;
      var self = this;

      this.layer = L.geoJson(this.data, {
        pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, _.defaults({
            fillColor: '#41f',
            radius: 8
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
