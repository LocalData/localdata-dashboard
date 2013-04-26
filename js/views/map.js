/*jslint nomen: true */
/*globals define: true */

define([
  // Libraries
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/leaflet.tilejson',
  'moment',
  'lib/tinypubsub',

  // LocalData
  'settings',
  'api',

  // Models
  'models/responses'
],

function($, _, Backbone, L, moment, events, settings, api, Responses) {
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
      _.bindAll(this, 'render', 'addTileLayer', 'selectObject', 'renderObject', 'renderObjects', 'getResponsesInBounds', 'updateMapStyleBasedOnZoom', 'updateObjectStyles');

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

    addTileLayer: function(tilejson) {
      console.log(tilejson);
      this.tileLayer = new L.TileJSON.createTileLayer(tilejson);
      this.map.addLayer(this.tileLayer);
      this.tileLayer.bringToFront();
    },

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
          zoom: 12,
          maxZoom: 18,
          center: [42.439167,-83.083420]
        });

        // SF overview: [37.7750,-122.4183]
        // this.map.setView([42.3314,-83.0458], 11); // Detroit overview
        // this.map.setView([42.370805,-83.079728], 17);  // Bethune


        // Don't think this is needed: this.markers = {};

        this.baseLayer = L.tileLayer('http://a.tiles.mapbox.com/v3/matth.map-zmpggdzn/{z}/{x}/{y}.png');
        this.map.addLayer(this.baseLayer);
        this.satelliteLayer = L.tileLayer('http://a.tiles.mapbox.com/v3/matth.map-yyr7jb6r/{z}/{x}/{y}.png');
        this.activeLayer = 'streets';

        // Set up the base map; add the parcels and done markers
        this.map.addLayer(this.zoneLayer);
        this.map.addLayer(this.objectsOnTheMap);

        //  http://matth-nt.herokuapp.com/
        // Get tilejson
        var request = $.ajax({
          url: 'http://localhost:3001/' + this.survey.get('id') + '/filter/condition/tile.json',
          type: "GET",
          dataType: "jsonp"
        });

        console.log("REQUESTING TILE LAYER");
        request.done(this.addTileLayer);

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
        // We got an array of models. Let's plot them.
        // this.plotResponses(arg);
      } else {
        // Plot all of the responses from the responses collection.
        // this.plotResponses();
      }
      events.publish('loading', [false]);
      return this;
    },

    // Set filter parameters for displaying results on the map
    setFilter: function (question, answers) {
      this.filter = {
        question: question,
        answers: answers
      };
      this.plotResponses();
    },

    // Incrementally plot a set of responses on the map.
    // Optional parameters: "question", [answers]
    // If given, each result on the map will be styled by answers to
    // question.
    plotResponses: function (responses) {
      var indexOfColorToUse;
      var color;

      if (responses === undefined) {
        // Plot all of the responses from the collection.
        // Clear out the old results first
        this.objectsOnTheMap.clearLayers();
        this.parcelIdsOnTheMap = {};

        // TODO: not great form to reassign one of the arguments
        responses = this.responses.models;
      }

      var renderedParcelTracker = this.parcelIdsOnTheMap;
      var filter = this.filter;

      // Create GeoJSON FeatureCollection objects to pass to Leaflet for
      // rendering.

      var featureCollection = {
        type: 'FeatureCollection',
        features: []
      };

      var pointCollection = {
        type: 'FeatureCollection',
        features: []
      };

      // Populate the FeatureCollection for responses with full geometry.
      featureCollection.features = _.map(_.filter(responses, function (response) {
        // Get items with geometry that we haven't seen yet
        return (_.has(response.get('geo_info'), 'geometry')
                && !_.has(renderedParcelTracker, response.get('parcel_id')));
      }), function (response) {
        var parcelId = response.get('parcel_id');
        renderedParcelTracker[parcelId] = true;

        var feature = {
          type: 'Feature',
          id: response.get('id'),
          parcelId: parcelId,
          geometry: response.get('geo_info').geometry
        };

        // Color the results if necessary
        if (filter !== null) {
          var questions = response.get('responses');
          var answerToQuestion = questions[filter.question];

          // Figure out what color to use
          // TODO: memoize the index lookup?
          feature.properties = {
            color: indexToColor(_.indexOf(filter.answers, answerToQuestion))
          };
        }
        return feature;
      });

      // Populate the FeatureCollection for responses with only a centroid.
      pointCollection.features = _.map(_.filter(responses, function (response) {
        return (!_.has(response.get('geo_info'), 'geometry')
                && _.has(response.get('geo_info'), 'centroid'));
      }), function (response) {
        var id = response.get('id');
        renderedParcelTracker[id] = true;

        return {
          type: 'Feature',
          id: id,
          geometry: {
            type: 'Point',
            coordinates: response.get('geo_info').centroid
          }
        };
      });

      // If we found some full-geometry responses, set up the style and pass
      // them to Leaflet.
      if (featureCollection.features.length > 0) {
        var style = this.defaultStyle;
        if (filter !== null) {
          style = getFeatureStyle;
        }

        var featureLayer = new L.geoJson(featureCollection, {
          pointToLayer: this.defaultPointToLayer,
          style: style
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
      }
    },

    updateObjectStyles: function(style) {
      console.log("Changing style");
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
      console.log("Map style update triggered");

      // Don't update the styles if there's a filter in place
      if (this.filter !== null) {
        return;
      }

      // _kmq.push(['record', "Map zoomed"]);
      var zoom = this.map.getZoom();

      // Objects should be more detailed close up (zoom 10+)
      if(zoom > 10) {

        this.tileLayer.bringToFront();

        console.log("Greater than 10");

        // If we're in pretty close, show the satellite view
        if(zoom > 14) {

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
          if(this.activeLayer !== 'streets') {
            console.log("MID ZOOM LEVELS");
            this.map.removeLayer(this.satelliteLayer);
            this.map.addLayer(this.baseLayer, true);
            this.activeLayer = 'streets';
          }
        }

      }else {
        // Far zoom (< 10)
        // Show a more abstract map when zoomed out
        if(this.activeLayer !== 'streets') {
          console.log("STREETS LEVEL");
          this.map.removeLayer(this.satelliteLayer);
          this.map.addLayer(this.baseLayer, true);
          this.activeLayer = 'streets';
        }
      }

      // If a parcel is selected, make sure it says visually selected
      if (this.selectedLayer !== null) {
        this.selectedLayer.setStyle(settings.selectedStyle);
      }
    },

    getParcelsInBounds: function() {
      // Don't add any parcels if the zoom is really far out.
      var zoom = this.map.getZoom();
      if(zoom < 16) {
        return;
      }

      // If there are a lot of objects, let's clear them out
      // to improve performance
      if( _.size(this.parcelIdsOnTheMap) > 1250 ) {
        this.objectsOnTheMap.clearLayers();
        this.parcelIdsOnTheMap = {};
      }

      // Get parcel data in the bounds
      api.getObjectsInBounds(this.map.getBounds(), this.renderObjects);
    },

    // Get all the responses in the current viewport
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

    selectObject: function(event) {
      // _kmq.push(['record', "Map object selected"]);

      if (this.selectedLayer !== null) {
        this.selectedLayer.setStyle(this.defaultStyle);
      }

      // Select the current layer
      this.selectedLayer = event.layer;
      this.selectedLayer.setStyle(settings.selectedStyle);

      // Let's show some info about this object.
      this.details(this.selectedLayer.feature);
    },

    /**
     * When a parcel is clicked, show details for just that parcel.
     * @param  {Object} options An object with a parcelId or id property
     */
    details: function(feature) {
      console.log(feature);

      // Find out if we're looking up a set of parcels, or one point
      if(feature.parcelId !== undefined && feature.parcelId !== '') {
        console.log("Finding parcels ", feature.parcelId);
        this.sel = new Responses.Collection(this.responses.where({'parcel_id': feature.parcelId}));
      }else {
        console.log("Finding point", feature.id);
        this.sel = new Responses.Collection(this.responses.where({'id': feature.id}));
      }

      // Only show the most recent result for that parcel / point
      // TODO
      // Show previous results for the clicked parcel if that happens
      var selectedSingleObject = this.sel.toJSON()[0];

      // Humanize the date
      selectedSingleObject.createdHumanized = moment(selectedSingleObject.created, "YYYY-MM-DDThh:mm:ss.SSSZ").format("MMM Do h:mma");

      // Render the object
      $("#individual-result-container").html(_.template($('#indivdual-result').html(), {r: selectedSingleObject}));

      // Button to close the details view
      $("#individual-result-container .close").click(function(e) {
        e.preventDefault();
        $("#individual-result-container").html("");
      });
    }

  });

  return MapView;
});
