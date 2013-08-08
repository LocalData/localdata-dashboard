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

  function indexToColor(index) {
    if (index >= 0) return settings.colorRange[index + 1];
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
      fillColor: feature.properties.color,
      fillOpacity: 0.15,
      weight: 2
    };
  }

  var MapView = Backbone.View.extend({
    SATELLITE_URL: 'http://a.tiles.mapbox.com/v3/matth.map-yyr7jb6r/{z}/{x}/{y}.png',
    BASEMAP_URL: 'http://a.tiles.mapbox.com/v3/matth.map-n9bps30s/{z}/{x}/{y}.png',

    filtered: false,
    filter: null,
    map: null,
    markers: {},
    responses: null,
    selectedLayer: null,
    survey: null,

    initialize: function(options) {
      console.log("Init map view");
      _.bindAll(this,
        'render',
        'addTileLayer',
        'selectObject',
        'renderObject',
        'renderObjects',
        'getResponsesInBounds',
        'updateMapStyleBasedOnZoom',
        'updateObjectStyles',
        'styleFeature',
        'setupPolygon'
      );

      this.survey = options.survey;

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
     * Given tilejson data, add the tiles and the UTF grid
     * @param  {Object} tilejson
     */
    addTileLayer: function(tilejson) {
      this.tileLayer = new L.TileJSON.createTileLayer(tilejson);
      this.map.addLayer(this.tileLayer);
      this.tileLayer.bringToFront();

      this.gridLayer = new L.UtfGrid(tilejson.grids[0], {
        resolution: 1
      });
      this.map.addLayer(this.gridLayer);

      // Handle clicks on the grid layer
      this.gridLayer.on('click', this.selectObject);
    },

    render: function (arg) {
      if (this.map !== null) return;

      // Create the map.
      this.$el.html(_.template($('#map-view').html(), {}));

      // Initialize the map
      this.map = new L.map('map', {
        zoom: 16,
        maxZoom: 18,
        center: [42.439167,-83.083420]
      });
      // SF overview: [37.7750,-122.4183]
      // this.map.setView([42.3314,-83.0458], 11); // Detroit overview
      // this.map.setView([42.370805,-83.079728], 17);  // Bethune

      this.baseLayer = L.tileLayer(this.BASEMAP_URL).addTo(this.map);
      this.satelliteLayer = L.tileLayer(this.SATELLITE_URL);
      this.activeLayer = 'streets';

      // Set up the base map; add the parcels and done markers
      this.map.addLayer(this.zoneLayer);
      this.map.addLayer(this.objectsOnTheMap);

      // Get tilejson
      //'http://matth-nt.herokuapp.com/' + this.survey.get('id') + '/tile.json',
      //url: 'http://localhost:3001/' + this.survey.get('id') + '/filter/condition/tile.json',
      var request = $.ajax({
        url: '/tiles/' + this.survey.get('id') + '/tile.json',
        type: "GET",
        dataType: "jsonp"
      });
      request.done(this.addTileLayer);

      this.map.on('zoomend', this.updateMapStyleBasedOnZoom);

      // Handle zones
      if (this.survey.has('zones')) this.plotZones();
      this.listenTo(this.survey, 'change', this.plotZones);

      return this;
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
      if (!this.survey.has('zones')) return;

      var zones = this.survey.get('zones');
      this.zoneLayer.clearLayers();
      this.zoneLayer.addLayer(new L.geoJson(zones, {
        style: zoneStyle
      }));

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
        geojsonLayer.on('click', this.selectObject);

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

      // Objects should be more detailed close up (zoom 10+)
      if(zoom > 10) {

        this.tileLayer.bringToFront();

        console.log("Greater than 10");

        // If we're in pretty close, show the satellite view
        if(zoom > 14) {
          if(this.activeLayer !== 'satellite') {
            this.map.removeLayer(this.baseLayer);
            this.map.addLayer(this.satelliteLayer, true);
            this.satelliteLayer.bringToBack();
            this.activeLayer = 'satellite';
          }

          if(this.activeLayer !== 'satellite') {
            console.log("Active layer begin", this.activeLayer);
            this.map.removeLayer(this.baseLayer);
            this.map.addLayer(this.satelliteLayer, true);
            this.satelliteLayer.bringToBack();
            this.activeLayer = 'satellite';
            console.log("Active layer end", this.activeLayer);
          }

        } else {
          // Mid zoom (11-14)
          // We're not that close, show the mid zoom styles
          if(this.defaultStyle !== settings.midZoomStyle) {
            this.defaultStyle = settings.closeZoomStyle;
            this.updateObjectStyles(settings.closeZoomStyle);
          }

          // And use the terrain map
          if (this.activeLayer !== 'streets') {
            // Show a more abstract map when zoomed out
            this.map.removeLayer(this.satelliteLayer);
            this.map.addLayer(this.baseLayer, true);
            this.activeLayer = 'streets';
          }
        }

      }else {
        // Far zoom (< 10)
        // Show a more abstract map when zoomed out
        if (this.activeLayer !== 'streets') {
          this.map.removeLayer(this.satelliteLayer);
          this.map.addLayer(this.baseLayer, true);
          this.activeLayer = 'streets';

          this.defaultStyle = settings.farZoomStyle;
          this.updateObjectStyles(settings.farZoomStyle);
        }
      }

      // If a parcel is selected, make sure it says visually selected
      if (this.selectedLayer !== null) {
        this.selectedLayer.setStyle(settings.selectedStyle);
      }
    },


    /**
     * Highlight a selected object; un-hilight any previously selected object
     * @param  {Object} event
     */
    selectObject: function(event) {
      _kmq.push(['record', "Map object selected"]);

      // Remove any previously selected layer
      if (this.selectedLayer !== null) {
        this.map.removeLayer(this.selectedLayer);
      }

      // Add a layer
      this.selectedLayer = new L.GeoJSON(event.data.geometry);
      this.selectedLayer.setStyle(settings.selectedStyle);
      this.map.addLayer(this.selectedLayer);

      // Let's show some info about this object in the sidebar.
      this.details(event.data);
    },


    showDetails: function(responses) {
      console.log(responses);
      var selectedItemListView = new ResponseListView({
        collection: collection
      });
      $("#result-container").html(selectedItemListView.render().$el);
    },


    /**
     * Show details for a particular feature.
     *
     * @param  {Object} options An object with a parcelId or id property
     */
    details: function(feature) {
      // Find out if we're looking up a set of parcels, or one point
      var id;
      if(feature.parcel_id !== undefined && feature.parcel_id !== '') {
        id = feature.parcel_id;
      }else {
        id = feature.id;
      }

      var collection = new Responses.Collection([], {
        surveyId: surveyId,
        objectId: id
      });
      collection.on('reset', this.showDetails);
    }

  });

  return MapView;
});
