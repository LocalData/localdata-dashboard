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
        'controlUTFZoom',
        'fitBounds',
        'selectObject',
        'deselectObject',
        'addTileLayer'
      );

      this.defaultStyle = settings.farZoomStyle;
      this.defaultPointToLayer = function (feature, latlng) {
        return L.circleMarker(latlng, settings.circleMarker);
      };

      this.config = options.config;
    },


    /**
     * Hide or show the UTF Grid based on zoom level.
     */
    controlUTFZoom: function() {
      var zoom = this.map.getZoom();
      var hasGridLayer = this.map.hasLayer(this.gridLayer);

      if (zoom < MIN_GRID_ZOOM && hasGridLayer) {
        this.map.removeLayer(this.gridLayer);
      }

      // FIXME: We need to manage multiple grid layers
      if (zoom >= MIN_GRID_ZOOM && !hasGridLayer && this.gridLayer) {
        this.map.addLayer(this.gridLayer);
      }
    },


    addTileLayer: function (layer) {
      this.map.addLayer(layer);
    },

    removeTileLayer: function (layer) {
      this.map.removeLayer(layer);
    },
    
    addGridLayer: function (layer) {
      // Make sure the grid layer is on top.
      if (this.map.getZoom() >= MIN_GRID_ZOOM) {
        this.map.addLayer(layer);
        layer.on('click', this.selectObject);
      }
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
      this.map = new L.map(this.$('#map')[0], {
        zoom: this.config.zoom,
        center: this.config.center,
        zoomControl: false
      });

      this.map.addControl(L.control.zoom({ position: 'topright' }));

      // Set up the base maps
      this.baseLayer = L.tileLayer(settings.baseLayer);
      this.satelliteLayer = L.tileLayer(settings.satelliteLayer);
      this.printLayer = L.tileLayer(settings.printLayer);
      this.map.addLayer(this.baseLayer);
      var baseMaps = {
        "Streets": this.baseLayer,
        "Satellite": this.satelliteLayer,
        "Print": this.printLayer
      };

      // Make sure we don't show the UTF grid too far out.
      this.map.on('zoomend', this.controlUTFZoom);

      // Add the layer control
      // Make sure the layer stays in the background
      L.control.layers(baseMaps).addTo(this.map);
      this.baseLayer.bringToBack();
      this.map.on('baselayerchange', function(event) {
        event.layer.bringToBack();
      });

      return this;
    },

    /**
     * Highlight a selected object
     * @param  {Object} event
     */
    selectObject: function (event) {
      this.trigger('click', event);

      if (!event.data) {
        return;
      }

      this.deselectObject();

      // Add a layer with a visual selection
      this.selectedLayer = new L.GeoJSON(event.data.geometry, {
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
    }
  });
});