/*jslint nomen: true */
/*globals define: true */

define(function (require) {
  'use strict';

  // Libraries
  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');
  var L = require('lib/leaflet/leaflet.tilejson');
  var moment = require('moment');

  // LocalData
  var settings = require('settings');
  var api = require('api');

  // Templates
  var template = require('text!templates/responses/map.html');

  function flip(a) {
    return [a[1], a[0]];
  }

  function zoneStyle(feature) {
    return {
      color: feature.properties.color,
      opacity: 0.3,
      fillOpacity: 0.0,
      weight: 2
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
      console.log("Init map view");
      _.bindAll(this,
        'render',
        'update',
        'fitBounds',
        'selectObject',
        'deselectObject',
        'addTileLayer',
        'search',
        'searchResults',
        'setZone'
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
      this.gridLayer = new L.UtfGrid(tilejson.grids[0], {
        resolution: 4
      });

      // Make sure the grid layer is on top.
      this.map.addLayer(this.gridLayer);

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
      // var bounds = this.survey.get('responseBounds');
      // if (bounds) {
      //   bounds = [flip(bounds[0]), flip(bounds[1])];
      //   if (bounds[0][0] === bounds[1][0] || bounds[0][1] === bounds[1][1]) {
      //     this.map.setView(bounds[0], 15);
      //   } else {
      //     this.map.fitBounds(bounds, {
      //       reset: true,
      //       maxZoom: 18
      //     });
      //   }
      // }
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
        // Render the map template
        this.$el.html(this.template({}));

        // Initialize the map
        this.map = new L.map('map', {
          zoom: 15,
          center: [37.770888, -122.39409]
        });

        // Set up the base maps
        this.baseLayer = L.tileLayer(settings.baseLayer);
        //this.baseLayer = this.satelliteLayer = L.tileLayer(settings.satelliteLayer);
        this.satelliteLayer = L.tileLayer(settings.satelliteLayer);
        this.printLayer = L.tileLayer(settings.printLayer);
        this.map.addLayer(this.baseLayer);
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
          _kmq.push(['record', "Baselayer changed to " + event.name]);
        });


        // FIXME: This is a hack. The map element doesn't have a size yet, so
        // Leaflet doesn't know how to set the view properly. If we wait until
        // the next tick and call invalidateSize, then the map will know its
        // size.
        setTimeout(function () {
          this.map.addLayer(this.zoneLayer);

          this.map.setView([37.770888,-122.39409]);

          // Center the map
          // this.fitBounds();
        }.bind(this), 0);

        // Handle zones
        if (this.survey.has('zones')) {
          this.plotZones();
        }
        this.listenTo(this.survey, 'change', this.plotZones);

        this.selectDataMap();

        // Initialize the FeatureGroup to store editable layers
        this.drawnItems = new L.FeatureGroup();
        this.map.addLayer(this.drawnItems);

        // Initialize the draw control and pass it the FeatureGroup of editable layers
        var drawControl = new L.Control.Draw({
          draw: {
            polyline: false,
            rectangle: false,
            circle: false,
            marker:false,
            polygon: {
              shapeOptions: {
                  color: '#ef6d4a',
                  fillColor: '#ef6d4a'
              }
            }
          },
          edit: {
            featureGroup: this.drawnItems
          }
        });
        this.map.addControl(drawControl);

        this.map.on('draw:created', this.setZone);

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

      console.log("Getting tilejson", url);
      // Get TileJSON
      $.ajax({
        url: url,
        type: 'GET',
        dataType: 'json',
        cache: false
      }).done(function() {}) //this.addTileLayer) // TODO - DISABLED FOR DEMO
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


    clearFilter: function () {
      this.filter = null;
      this.selectDataMap();
    },

    setZone: function (event) {
      var type  = event.layerType,
          layer = event.layer;

      var feature = layer.toGeoJSON();
      // We can use feature.geometry to filter the data
      console.log(JSON.stringify(feature.geometry)); // XXX
      this.trigger('zoneCreated', feature.geometry, JSON.stringify(feature.geometry));

      // Invert the selection, so we have a hole.
      var bounds = this.map.getBounds().pad(3);
      layer.setLatLngs([
        [bounds.getSouthWest(), bounds.getNorthWest(), bounds.getNorthEast(), bounds.getSouthEast(), bounds.getSouthWest()],
        layer.getLatLngs()
      ]);

      var color = '#63e';
      layer.setStyle({
        color: color,
        opacity: 0.8,
        fillColor: color
      });

      this.drawnItems.clearLayers();
      this.drawnItems.addLayer(layer);
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
        style: zoneStyle
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
