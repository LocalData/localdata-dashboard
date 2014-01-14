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
  'settings',
  'api',

  // Views
  'views/responses/list',

  // Models
  'models/responses'
],

function($, _, Backbone, L, moment, events, _kmq, settings, api, ResponseListView, Responses) {
  'use strict';

  function flip(a) {
    return [a[1], a[0]];
  }

  function indexToColor(index) {
    if (index >= 0) {
      return settings.colorRange[index + 1];
    }
    return settings.colorRange[0];
  }

  function getFeatureStyle(feature) {
    if (feature.properties === undefined || feature.properties.color === undefined) {
      return settings.styleTemplate;
    }

    var style = {};
    _.extend(style, settings.styleTemplate, {
      color: feature.properties.color,
      fillColor: feature.properties.color
    });
    return style;
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
    map: null,
    markers: {},
    responses: null,
    selectedLayer: null,
    survey: null,
    gridLayer: null,

    initialize: function(options) {
      console.log("Init map view");
      _.bindAll(this,
        'render',
        'update',
        'fitBounds',
        'selectObject',
        'deselectObject',
        'renderObject',
        'renderObjects',
        'updateMapStyleBasedOnZoom',
        'updateObjectStyles',
        'styleFeature',
        'addTileLayer'
      );

      this.survey = options.survey;
      this.clickHandler = options.clickHandler;

      this.parcelIdsOnTheMap = {};
      this.objectsOnTheMap = new L.FeatureGroup();
      this.zoneLayer = new L.FeatureGroup();

      this.defaultStyle = settings.farZoomStyle;
      this.defaultPointToLayer = function (feature, latlng) {
        return new L.circleMarker(latlng, settings.farZoomStyle);
      };

      this.delayFitBounds = _.debounce(this.fitBounds, 250);

      this.render();
    },


    /**
     * Given tilejson data, add the tiles and the UTFgrid
     * @param  {Object} tilejson
     */
    addTileLayer: function(tilejson) {
      console.log("Got the tilejson", tilejson);

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

      console.log("Gridlayer", this.gridLayer);
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
          this.map.fitBounds(bounds, { reset: true });
        }
      }
    },

    update: function() {
      this.tileLayer.redraw();
      if(this.gridLayer) {
        this.gridLayer.redraw();
      }
      this.fitBounds();
    },

    render: function() {
      if (this.map === null) {
        // Render the map template
        this.$el.html(_.template($('#map-view').html(), {}));

        // Initialize the map
        this.map = new L.map('map', {
          zoom: 15,
          center: [37.77585785035733, -122.41362811351655]
        });

        // Set up the base map; add the parcels and done markers
        this.baseLayer = L.tileLayer(settings.baseLayer);
        this.map.addLayer(this.baseLayer);

        // FIXME: This is a hack. The map element doesn't have a size yet, so
        // Leaflet doesn't know how to set the view properly. If we wait until
        // the next tick and call invalidateSize, then the map will know its
        // size.
        setTimeout(function () {
          this.map.addLayer(this.zoneLayer);
          this.updateMapStyleBasedOnZoom();
          this.map.on('zoomend', this.updateMapStyleBasedOnZoom);

          // Center the map
          this.fitBounds();
        }.bind(this), 0);

        // Handle zones
        if (this.survey.has('zones')) {
          this.plotZones();
        }
        this.listenTo(this.survey, 'change', this.plotZones);

        this.selectDataMap();
        this.map.on('zoomend', this.updateMapStyleBasedOnZoom);
      }

      return this;
    },

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

    clearFilter: function () {
      this.filter = null;
      this.selectDataMap();
    },

    /**
     * Style a feature
     * @param  {Object} feature
     * @return {Object}         feature with style attributes
     */
    styleFeature: function(data) {
      // Set a default style
      var style = this.defaultStyle;

      // If there's no data, style this as blank
      if(data === undefined || this.filter === null) {
        return style;
      }

      // Set the default filter style
      style = _.extend({
        color: settings.colorRange[0],
        fillColor: settings.colorRange[0]
      }, settings.styleTemplate);

      // Get the answer to the currently filtered question
      var answer = data[this.filter.question];

      // If there's no answer, style this as a blank answer
      if (answer === undefined) {
        return style;
      }

      // Set the line and fill colors, then return the style
      style.color = this.filter.answers[answer].color;
      style.fillColor = style.color;
      return style;
    },

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

    updateObjectStyles: function(style) {
      this.objectsOnTheMap.setStyle(style);
    },

    // Expects an object with properties
    // obj.parcelId: ID of the given object
    // obj.geometry: GeoJSON geometry object
    renderObject: function(obj, style, pointToLayer) {

      if (style === undefined) {
        style = this.defaultStyle;
      }

      if (pointToLayer === undefined) {
        pointToLayer = this.defaultPointToLayer;
      }

      // We don't want to re-draw parcels that are already on the map
      // So we keep a hash map with the layers so we can unrender them
      if(! _.has(this.parcelIdsOnTheMap, obj.parcelId) || obj.parcelId === ''){

        // Make sure the format fits Leaflet's geoJSON expectations
        obj.type = "Feature";

        // Create a new geojson layer and style it.
        var geojsonLayer = new L.geoJson(obj, {
          pointToLayer: pointToLayer,
          style: style
        });
        geojsonLayer.on('click', this.handleResponses);

        // Add the layer to the layergroup and the hashmap
        this.objectsOnTheMap.addLayer(geojsonLayer); // was (geojsonLayer);
        this.parcelIdsOnTheMap[obj.parcelId] = geojsonLayer;
      }
    },

    renderObjects: function(results) {
      _.each(results, function(elt) {
        this.renderObject(elt);
      }, this);
    },

    updateMapStyleBasedOnZoom: function(e) {
      // Don't update the styles if there's a filter in place
      if (this.filter !== null) {
        return;
      }

      _kmq.push(['record', "Map zoomed"]);
      var zoom = this.map.getZoom();

      // Objects should be more detailed close up (zoom 14+)
      // And easier to see when zoomed out (zoom >= 16)
      // With a transition state in the middle
      if(zoom < 14 && this.defaultStyle !== settings.farZoomStyle) {
        this.defaultStyle = settings.farZoomStyle;
        this.updateObjectStyles(settings.farZoomStyle);
      }else if (zoom < 16 && zoom > 13 && this.defaultStyle !== settings.midZoomStyle) {
        this.defaultStyle = settings.midZoomStyle;
        this.updateObjectStyles(settings.midZoomStyle);
      }else if(zoom >= 16 && this.defaultStyle !== settings.closeZoomStyle) {
        this.defaultStyle = settings.closeZoomStyle;
        this.updateObjectStyles(settings.closeZoomStyle);
      }

      // If a parcel is selected, make sure it says visually selected
      if (this.selectedLayer !== null) {
        this.selectedLayer.setStyle(settings.selectedStyle);
      }
    },


    /**
     * Hilight a selected object; un-hilight any previously selected object
     * @param  {Object} event
     */
    selectObject: function(event) {
      _kmq.push(['record', "Map object selected"]);
      console.log("Selected object", event);
      if (!event.data) {
        return;
      }

      this.deselectObject();

      // Add a layer
      this.selectedLayer = new L.GeoJSON(event.data.geometry);
      this.selectedLayer.setStyle(settings.selectedStyle);
      this.map.addLayer(this.selectedLayer);
      this.selectedLayer.bringToFront();
    },

    deselectObject: function() {
      if (this.selectedLayer !== null) {
        this.map.removeLayer(this.selectedLayer);
        delete this.selectedLayer;
      }
    }

  });

  return MapView;
});
