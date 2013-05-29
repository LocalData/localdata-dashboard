/*jslint nomen: true */
/*globals define: true */

define([
  // Libraries
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/leaflet/leaflet.google',
  'moment',
  'lib/tinypubsub',
  'lib/kissmetrics',

  // LocalData
  'settings',
  'api',

  // Views
  'views/response/response-list',

  // Models
  'models/responses'
],

function($, _, Backbone, L, moment, events, _kmq, settings, api, ResponseListView, Responses) {
  'use strict';

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
      fillColor: feature.properties.color,
      fillOpacity: 0.15,
      weight: 2
    };
  }


  var MapView = Backbone.View.extend({

    map: null,
    responses: null,
    survey: null,
    paginationView: null,
    selectedLayer: null,
    filtered: false,
    selectedObject: {},
    markers: {},
    filter: null,

    initialize: function(options) {
      console.log("Init map view");
      _.bindAll(this, 'render', 'selectObject', 'renderObject', 'renderObjects',
        'getResponsesInBounds', 'updateMapStyleBasedOnZoom', 'updateObjectStyles',
        'styleFeature', 'setupPolygon');

      this.responses = options.responses;
      // TODO: if we add the filter logic to the responses collection, we can
      // more cleanly trigger off its events.
      this.listenTo(this.responses, 'reset', this.render);
      this.listenTo(this.responses, 'addSet', this.render);

      this.survey = options.survey;

      // We track the results on the map using these two groups
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

    fitBounds: function () {
      this.map.invalidateSize(false);

      if (this.responses !== null && this.responses.length > 0) {
        try {
          this.map.fitBounds(this.objectsOnTheMap.getBounds());
        } catch (e) {
        }
      } else if (this.survey.has('zones')) {
        try {
          this.map.fitBounds(this.zoneLayer.getBounds());
        } catch (e) {
        }
      }
    },

    // Debounced version of fitBounds. Created in the initialize method.
    delayFitBounds: null,


    render: function (arg) {
      var hasResponses = this.responses !== null && this.responses.length > 0;
      var hasZones = this.survey.has('zones');

      // Don't draw a map if there are no responses and no survey zones to
      // plot.
      if (!hasResponses && !hasZones) {
        return;
      }

      if (this.map === null) {
        // Create the map.
        this.$el.html(_.template($('#map-view').html(), {}));

        // Initialize the map
        this.map = new L.map('map', {
          zoom: 15
        });

        // Set up the base map; add the parcels and done markers
        this.baseLayer = L.tileLayer('http://a.tiles.mapbox.com/v3/matth.map-zmpggdzn/{z}/{x}/{y}.png');
        this.map.addLayer(this.baseLayer);
        this.satelliteLayer = L.tileLayer('http://a.tiles.mapbox.com/v3/matth.map-yyr7jb6r/{z}/{x}/{y}.png');
        this.activeLayer = 'streets';

        this.map.addLayer(this.zoneLayer);
        this.map.addLayer(this.objectsOnTheMap);

        this.map.setView([0,0], 17); // default center
        this.updateMapStyleBasedOnZoom();
        this.map.on('zoomend', this.updateMapStyleBasedOnZoom);
      }

      if (hasZones) {
        // Plot the survey zones.
        this.plotZones();
      } else {
        // We don't start listening in initialize because we might get the
        // change event before we even have a map.
        this.listenTo(this.survey, 'change', this.plotZones);
      }

      // If there are no responses, don't bother trying to plot responses or
      // deal with filters.
      if (!hasResponses) {
        return;
      }

      // TODO: better message passing
      events.publish('loading', [true]);

      if (this.responses.filters === null) {
        this.filter = null;
      }

      if (_.isArray(arg)) {
        // We got an array of models. Let's plot just that set them.
        this.plotResponses(arg);
      } else {
        // Plot all of the responses from the responses collection.
        this.plotResponses();
      }


      events.publish('loading', [false]);
      return this;
    },


    /**
     * Set filter parameters for displaying results on the map
     * The response collection will activate this if we have an active filter
     * @param {String} question Name of the question, eg 'vacant'
     * @param {Object} answers  Possible answers to the qu
     */
    setFilter: function (question, answers) {
      this.filter = {
        question: question,
        answers: answers
      };
      this.plotResponses();
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


    /**
     * Set up a geojson feature for a response object with a polygon
     * @param  {Object} response a response object with a polygon
     * @return {Object}          GeoJSON feature
     */
    setupPolygon: function(response) {
      // Record the objects as rendered so we don't render it twice.
      var parcelId = response.get('parcel_id');
      this.parcelIdsOnTheMap[parcelId] = true;

      // Set up the default style
      var style = this.defaultStyle;

      // Set up the feature
      var feature = {
        type: 'Feature',
        id: response.get('id'),
        parcelId: parcelId,
        geometry: response.get('geo_info').geometry,
        style: style
      };

      // If there is a filter, attach the filtered question to the feature
      // This is used later to style the feature
      // We don't attach all the data to keep size down
      // (large collections can have 20+ mb of data)
      if (this.filter !== null) {

        // Some responses don't have associated data. It's still important that
        // they appear in the filter, since the user may be looking for empty
        // result sets.
        if(response.get('responses') === undefined) {
          feature[this.filter.question] = undefined;
        }else {
          feature[this.filter.question] = response.get('responses')[this.filter.question];
        }
      }

      // Return the feature for rendering
      return feature;
    },


    /**
     * Plot responses on the map
     * @param  {Array} responses
     */
    plotResponses: function (responses) {
      // If we aren't given an explicit set of responses to plot,
      // we'll plot all of the responses from the collection.
      if (responses === undefined) {

        // Clear out the old results first
        this.objectsOnTheMap.clearLayers();
        this.parcelIdsOnTheMap = {};

        // TODO: not great form to reassign one of the arguments
        responses = this.responses.models;
      }

      var renderedParcelTracker = this.parcelIdsOnTheMap;

      // We'll need to create GeoJSON FeatureCollection objects to pass
      // to Leaflet for rendering.
      var featureCollection = {
        type: 'FeatureCollection',
        features: []
      };

      var pointCollection = {
        type: 'FeatureCollection',
        features: []
      };

      // Populate the FeatureCollection for responses with full geometry.
      featureCollection.features = _.map(
        _.filter(responses, function (response) {

          // Get items that have geometry
          // AND aren't already on the map
          return (_.has(response.get('geo_info'), 'geometry') &&
                 !_.has(renderedParcelTracker, response.get('parcel_id'))
          );
      }), this.setupPolygon);

      // Populate the FeatureCollection for responses with only a centroid.
      pointCollection.features = _.map(
        _.filter(responses, function (response) {

        return (!_.has(response.get('geo_info'), 'geometry') &&
                _.has(response.get('geo_info'), 'centroid'));
      }), function (response) {

        // Record the objects as rendered so we don't render it twice.
        var id = response.get('id');
        renderedParcelTracker[id] = true;

        // Set up the feature
        var feature = {
          type: 'Feature',
          id: id,
          geometry: {
            type: 'Point',
            coordinates: response.get('geo_info').centroid
          }
        };

        return feature;
      });

      // If we found some full-geometry responses, set up the style and pass
      // them to Leaflet.
      if (featureCollection.features.length > 0) {
        // TODO: THE DATA IS GONE so the STYLE IS GONE.
        var featureLayer = new L.geoJson(featureCollection, {
          pointToLayer: this.defaultPointToLayer,
          style: this.styleFeature
        });
        featureLayer.on('click', this.selectObject);

        // Add the layer to the layergroup and the hashmap
        this.objectsOnTheMap.addLayer(featureLayer);
      }

      // If we found some centroid-only responses, set up the style and pass
      // them to Leaflet.
      if (pointCollection.features.length > 0) {
        var pointLayer = new L.geoJson(pointCollection, {
          pointToLayer: this.defaultPointToLayer,
          style: settings.circleMarker
        });
        pointLayer.on('click', this.selectObject);

        // Add the layer to the layergroup and the hashmap
        this.objectsOnTheMap.addLayer(pointLayer);
      }


      if (featureCollection.features.length > 0 || pointCollection.features.length > 0) {
        this.delayFitBounds();
      }
    },

    // Plot the zones of a survey
    plotZones: function () {
      if (this.survey.has('zones')) {
        var zones = this.survey.get('zones');

        // Clear the old layer
        this.zoneLayer.clearLayers();

        // Create and add the new layer
        this.zoneLayer.addLayer(new L.geoJson(zones, {
          style: zoneStyle
        }));

        // Fit the map to the zones, if appropriate.
        this.delayFitBounds();

        // Make sure objects are on top
        this.objectsOnTheMap.bringToFront();
      }
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

        // If we're in pretty close, show the satellite view
        if(zoom > 14) {
          if(this.activeLayer !== 'satellite') {
            this.map.removeLayer(this.baseLayer);
            this.map.addLayer(this.satelliteLayer, true);
            this.satelliteLayer.bringToBack();
            this.activeLayer = 'satellite';
          }

          if(this.defaultStyle !== settings.closeZoomStyle) {
            this.defaultStyle = settings.closeZoomStyle;
            this.updateObjectStyles(settings.closeZoomStyle);
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
        // Far zoom (>14)
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
     * Get all the responses in the current viewport
     */
    getResponsesInBounds: function(){
      console.log("Getting responses in the map");

      // Don't add any markers if the zoom is really far out.
      var zoom = this.map.getZoom();
      if(zoom < 17) {
        return;
      }

      // Get the objects in the bounds
      // And add them to the map
      api.getResponsesInBounds(this.map.getBounds(), this.addResultsToMap);
    },


    /**
     * Highlight a selected object; un-hilight any previously selected object
     * @param  {Object} event
     */
    selectObject: function(event) {
      _kmq.push(['record', "Map object selected"]);

      // Visually deselect the previous style
      if (this.selectedLayer !== null) {
        var originalStyle = this.styleFeature(this.selectedLayer.feature);
        this.selectedLayer.setStyle(originalStyle);
      }

      // Select the current layer
      this.selectedLayer = event.layer;
      this.selectedLayer.setStyle(settings.selectedStyle);

      // Let's show some info about this object.
      this.details(this.selectedLayer.feature);
    },


    /**
     * Show details for a particular feature.
     *
     * @param  {Object} options An object with a parcelId or id property
     */
    details: function(feature) {
      // Find out if we're looking up a set of parcels, or one point
      if(feature.parcelId !== undefined && feature.parcelId !== '') {
        this.sel = new Responses.Collection(this.responses.where({'parcel_id': feature.parcelId}));
      }else {
        this.sel = new Responses.Collection(this.responses.where({'id': feature.id}));
      }

      var selectedItemListView = new ResponseListView({collection: this.sel});
      $("#result-container").html(selectedItemListView.render().$el);

    }

  });

  return MapView;
});
