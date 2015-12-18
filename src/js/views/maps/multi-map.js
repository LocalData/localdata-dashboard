/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  // Libs
  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');
  var L = require('lib/leaflet/leaflet.tilejson');

  // LD
  var settings = require('settings');


  var MIN_GRID_ZOOM = 14; // furthest out we'll have interactive grids.

  /**
   * Creates a map view that can support multiple raster and grid layers and
   * is agnostic of the source/type of those layers.
   * TODO: Make this the base class the LocalData-specific dashboard map.
   */
  module.exports = Backbone.View.extend({
    map: null,
    selectedLayer: null,
    markers: {},

    initialize: function(options) {
      L.Icon.Default.imagePath = '/js/lib/leaflet/images';
      _.bindAll(this,
        'render',
        'fitBounds',
        'selectObject',
        'deselectObject',
        'addTileLayer'
      );

      if (options.baselayer) {
        this.baselayer = options.baselayer;
      }

      this.defaultStyle = settings.farZoomStyle;
      this.defaultPointToLayer = function (feature, latlng) {
        return L.circleMarker(latlng, settings.circleMarker);
      };

      this.config = options.config;
    },

    addTileLayer: function (layer) {
      this.map.addLayer(layer);
    },

    removeTileLayer: function (layer) {
      this.map.removeLayer(layer);
    },

    addGridLayer: function (layer, alwaysAddGrid) {
      // Make sure the grid layer is on top.
      if (alwaysAddGrid) {
        this.map.addLayer(layer);
      } else if (this.map.getZoom() >= MIN_GRID_ZOOM) {
        this.map.addLayer(layer);
      }
    },

    getZoom: function() {
      return this.map.getZoom();
    },

    removeGridLayer: function (layer) {
      this.map.removeLayer(layer);
    },

    loading: function() {
      $('.map-loading').show();
    },

    done: function() {
      $('.map-loading').hide();
    },

    fitBounds: function (latLngBounds) {
      if (latLngBounds[0][0] === latLngBounds[1][0] ||
          latLngBounds[0][1] === latLngBounds[1][1]) {
        this.map.setView(latLngBounds[0], 15);
      } else {
        this.map.fitBounds(latLngBounds, {
          reset: true,
          maxZoom: 18
        });
      }
    },

    render: function() {
      // Initialize the map
      var options = {
        zoom: this.config.zoom,
        center: [_.last(this.config.center), _.first(this.config.center)],
        zoomControl: false
      };

      if(_.has(this.config, 'scrollWheelZoom')) {
        options.scrollWheelZoom = this.config.scrollWheelZoom;
      }
      this.map = new L.map(this.$('#map')[0], options);

      // Remove the default "Leaflet |" attribution
      this.map.attributionControl.setPrefix('');

      this.map.on('click', this.clickHandler, this);
      this.map.on('zoomend', this.zoomHandler, this);

      this.map.addControl(L.control.zoom({ position: 'topright' }));

      // Set up the base maps
      this.baseLayer = L.tileLayer(this.baselayer || settings.baseLayer);
      this.satelliteLayer = L.tileLayer(settings.satelliteLayer);
      this.printLayer = L.tileLayer(settings.printLayer);
      this.map.addLayer(this.baseLayer, { attribution: 'LocalData' });
      var baseMaps = {
        "Streets": this.baseLayer,
        "Satellite": this.satelliteLayer,
        "Print": this.printLayer
      };

      // Add the layer control
      // Make sure the layer stays in the background
      L.control.layers(baseMaps).addTo(this.map);
      this.baseLayer.bringToBack();
      this.map.on('baselayerchange', function(event) {
        event.layer.bringToBack();
      });

      return this;
    },

    clickHandler: function (event) {
      this.trigger('click', event);
    },

    zoomHandler: function(event) {
      this.trigger('zoomend', event);
    },

    hasLayer: function(layer) {
      return this.map.hasLayer(layer);
    },

    /**
     * Highlight a selected object
     * @param  {Object} event
     */
    selectObject: function (feature) {
      this.deselectObject();

      // Add a layer with a visual selection
      this.selectedLayer = new L.GeoJSON(feature, {
        pointToLayer: this.defaultPointToLayer,
        style: settings.selectedStyle
      });

      this.map.addLayer(this.selectedLayer);
      this.selectedLayer.bringToFront();
    },


    /**
     * Un-highlight any previously selected object
     */
    deselectObject: function() {
      if (this.selectedLayer !== null) {
        this.map.removeLayer(this.selectedLayer);
        delete this.selectedLayer;
      }
    },

    goToLatLng: function (latlng) {
      // Remove any existing location marker
      if (this.markers.location !== undefined) {
        this.map.removeLayer(this.markers.location);
      }

      this.map.setView(latlng, 18);
      var marker = L.marker(latlng).addTo(this.map);
      this.markers.location = marker;

      // Simulate a click on the location
      var latLngPoint = new L.LatLng(latlng[0], latlng[1]);
      this.map.fireEvent('click', {
        latlng: latLngPoint
      });
    }
  });
});
