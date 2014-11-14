/*jslint nomen: true */
/*globals define: true */

define([
  // Libraries
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/leaflet/leaflet.tilejson',
  'moment',
  'lib/kissmetrics',

  // LocalData
  'settings',
  'api',

  // Templates
  'text!templates/responses/map.html'
],

function($, _, Backbone, L, moment, _kmq, settings, api, template) {
  'use strict';

  var MIN_GRID_ZOOM = 14; // furthest out we'll have interactive grids.

  function flip(a) {
    return [a[1], a[0]];
  }

  function zoneStyle(feature) {
    return {
      color: feature.properties.color,
      opacity: 0.8,
      fillOpacity: 0.0,
      weight: 3
    };
  }

  var MapView = Backbone.View.extend({
    BASEMAP_URL: 'http://a.tiles.mapbox.com/v3/matth.map-n9bps30s/{z}/{x}/{y}.png',

    filtered: false,
    filter: null,
    gridLayer: null,
    map: null,
    markers: {},
    responses: null,
    selectedLayer: null,
    survey: null,
    template: _.template(template),

    events: {
      'click .address-search-button': 'search'
    },

    initialize: function(options) {
      L.Icon.Default.imagePath = '/js/lib/leaflet/images';
      _.bindAll(this,
        'render',
        'controlUTFZoom',
        'update',
        'fitBounds',
        'selectObject',
        'deselectObject',
        'addTileLayer',
        'search',
        'searchResults'
      );

      this.survey = options.survey;
      this.clickHandler = options.clickHandler;

      this.parcelIdsOnTheMap = {};
      this.objectsOnTheMap = new L.FeatureGroup();
      this.zoneLayer = new L.FeatureGroup();

      this.defaultStyle = settings.farZoomStyle;
      this.defaultPointToLayer = function (feature, latlng) {
        return L.circleMarker(latlng, settings.circleMarker);
      };

      this.delayFitBounds = _.debounce(this.fitBounds, 250);

      this.render();
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

      if (zoom >= MIN_GRID_ZOOM && !hasGridLayer) {
        this.map.addLayer(this.gridLayer);
      }
    },


    /**
     * Given tilejson data, add the tiles and the UTFgrid
     * @param  {Object} tilejson
     */
    addTileLayer: function(tilejson) {
      if (this.tileLayer) {
        this.map.removeLayer(this.tileLayer);
      }
      this.tileLayer = new L.TileJSON.createTileLayer(tilejson);

      // Listen to see if we're loading the map
      this.tileLayer.on('loading', this.loading);
      this.tileLayer.on('load', this.done);

      this.map.addLayer(this.tileLayer);

      // Create the grid layer & handle clicks
      if (this.gridLayer) {
        this.map.removeLayer(this.gridLayer);
      }
      this.gridLayer = new L.UtfGrid(tilejson.grids[0], {
        resolution: 4
      });

      // Make sure the grid layer is on top.
      if (this.map.getZoom() >= MIN_GRID_ZOOM) {
        this.map.addLayer(this.gridLayer);
      }

      this.gridLayer.on('click', this.selectObject);
      if (this.clickHandler) {
        this.gridLayer.on('click', this.clickHandler);
      }
    },


    loading: function() {
      $('.map-loading').show();
    },


    done: function() {
      $('.map-loading').hide();
    },


    fitBounds: function() {
      var bounds = this.survey.get('responseBounds');
      if (bounds) {
        bounds = [flip(bounds[0]), flip(bounds[1])];
        if (bounds[0][0] === bounds[1][0] || bounds[0][1] === bounds[1][1]) {
          this.map.setView(bounds[0], 15);
        } else {
          this.map.fitBounds(bounds, {
            reset: true,
            maxZoom: 18
          });
        }
      }
    },


    /**
     * Updates the map.
     * Triggered when we know there are changes to the data.
     * Usually, we'd use Leaflet's redraw() function rather than removing
     * and re-adding layers. In this case, we can't do that, because gridLayer
     * doesn't have redraw().
     */
    update: function() {
      if(this.tileLayer) {
        this.map.removeLayer(this.tileLayer);
      }
      if(this.gridLayer) {
        this.map.removeLayer(this.gridLayer);
      }
      this.selectDataMap();
    },


    render: function() {
      if (this.map === null) {
        // Initialize the map
        this.map = new L.map('map', {
          zoom: 15,
          center: [37.77585785035733, -122.41362811351655],
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
          _kmq.push(['record', "Baselayer changed to " + event.name]);
        });


        // FIXME: This is a hack. The map element doesn't have a size yet, so
        // Leaflet doesn't know how to set the view properly. If we wait until
        // the next tick and call invalidateSize, then the map will know its
        // size.
        setTimeout(function () {
          this.map.addLayer(this.zoneLayer);

          // Center the map
          this.fitBounds();
        }.bind(this), 0);

        // Handle zones
        if (this.survey.has('zones')) {
          this.plotZones();
        }

        this.listenTo(this.survey, 'change', function () {
          if (this.survey.hasChanged('zones')) {
            this.plotZones();
          }
        });

        this.selectDataMap();
      }

      return this;
    },


    /**
     * Get the appropriate survey tiles.
     */
    selectDataMap: function () {
      // Build the appropriate TileJSON URL.
      var url = '/tiles/' + this.survey.get('id');
      if (this.filter) {
        if(this.filter.question) {
          url = url + '/filter/' + this.filter.question;
        }
        if(this.filter.answer) {
          url = url + '/' + this.filter.answer;
        }
      }
      url = url + '/tile.json';

      // Get TileJSON
      $.ajax({
        url: url,
        dataType: 'json',
        data: this.daterange,
        cache: false
      }).done(this.addTileLayer)
      .fail(function(jqXHR, textStatus, errorThrown) {
        console.log("Error fetching tilejson", jqXHR, textStatus, errorThrown);
      });
    },


    /**
     * Set filter parameters for displaying results on the map
     * The response collection will activate this if we have an active filter
     * @param {String} question Name of the question, eg 'vacant'
     * @param {Object} answers  Possible answers to the question
     */
    setFilter: function (question, answer) {
      this.filter = {
        question: question,
        answer: answer
      };
      this.map.invalidateSize();
      this.selectDataMap();
    },

    setDate: function(options) {
      this.daterange = options;
      this.map.invalidateSize();
      this.selectDataMap();
    },

    clearFilter: function () {
      this.filter = null;
      this.selectDataMap();
    },

    /**
     * Plot survey zones on the map
     */
    plotZones: function () {
      if (!this.survey.has('zones')) {
        return;
      }

      var zones = this.survey.get('zones');
      this.zoneLayer.clearLayers();
      this.zoneLayer.addLayer(new L.geoJson(zones, {
        style: zoneStyle,
        clickable: false
      }));

      // This is a leaflet workaround. Leaflet doesn't allow tiles on top of objects
      // When there are zones drawn on the map, they are on top, which means the
      // grid layer can't be clicked.
      // Hopefully will be fixed in 0.8 or 1.0
      this.zoneLayer.on('click', function(e) {
        this.gridLayer._click(e);
      }.bind(this));

      this.delayFitBounds();
      this.objectsOnTheMap.bringToFront();
    },


    /**
     * Highlight a selected object
     * @param  {Object} event
     */
    selectObject: function(event) {
      _kmq.push(['record', "Map object selected"]);
      console.log("Selected object", event);
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


    /**
     * Search for an address
     */
    search: function(event) {
      event.preventDefault();
      var address = $('#address-search').val();
      var location = this.survey.get('location');
      api.codeAddress(address, location, this.searchResults);
    },


    searchResults: function(error, results) {
      if(error) {
        $('#map-tools .error').html(error.message);
      }else {
        $('#map-tools .error').html('');
      }

      // Remove any existing location marker
      if(this.markers.location !== undefined) {
        this.map.removeLayer(this.markers.location);
      }

      var latlng = results.coords;
      this.map.setView(latlng, 18);
      var marker = L.marker(latlng).addTo(this.map);
      this.markers.location = marker;
    }
  });

  return MapView;
});
