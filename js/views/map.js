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

  // LocalData
  'settings',
  'api',

  // Models
  'models/responses'
],

function($, _, Backbone, L, moment, events, settings, api, Responses) {
  'use strict'; 
  
  var MapView = Backbone.View.extend({

    map: null,
    responses: null,
    surveyId: null,
    paginationView: null,
    selectedLayer: null,
    filtered: false,
    selectedObject: {},
    markers: {},  
    
    initialize: function(options) {
      console.log("Init map view");
      _.bindAll(this, 'render', 'selectObject', 'renderObject', 'renderObjects', 'getResponsesInBounds', 'updateMapStyleBasedOnZoom', 'updateObjectStyles');
      
      this.responses = options.responses;
      this.responses.on('reset', this.render, this);

      // We track the results on the map using these two groups
      this.parcelIdsOnTheMap = {};
      this.objectsOnTheMap = new L.FeatureGroup();
      this.doneMarkersLayerGroup = new L.FeatureGroup();

      this.defaultStyle = settings.farZoomStyle;

      this.$el.html(_.template($('#map-view').html(), {}));

      // Initialize the map
      this.map = new L.map('map');
      
      // Set up the base map; add the parcels and done markers
      this.googleLayer = new L.Google("TERRAIN");
      this.map.addLayer(this.googleLayer); 
      this.map.addLayer(this.objectsOnTheMap);

      this.map.setView([42.374891,-83.069504], 17); // default center
      this.map.on('zoomend', this.updateMapStyleBasedOnZoom);

      this.render();
    },  
    
    render: function() {  
      // TODO: better message passing
      events.publish('loading', [true]);
      this.mapResponses();
      events.publish('loading', [false]);
    },

    // Map all the responses on the map
    // Optional paramemters: "question", [answers] 
    // If given, the each result on the map will be styled by answers to
    // question.
    mapResponses: function(question, answers) {
      var indexOfColorToUse;
      var color;
      var style = this.defaultStyle;

      if(question !== undefined) {
        this.filtered = true;
      }

      // Clear out all the old results
      this.objectsOnTheMap.clearLayers();
      this.parcelIdsOnTheMap = {};

      _.each(this.responses.models, function(response){


        // Skip old records that don't have geo_info
        var geoInfo = response.get("geo_info");

        if (geoInfo === undefined) {
          console.log("Skipping geo object");
          return;
        }

        // Make sure were have the geometry for this parcel
        if(_.has(geoInfo, "geometry")) {
          console.log("This has geometry");
          var toRender = {
            parcelId: response.get("parcel_id"),
            geometry: response.get("geo_info").geometry 
          };

          // Color the results if necessary
          // TODO: lots of optimization possible here! 
          if (this.filtered) {
            var questions = response.get("responses");
            var answerToQuestion = questions[question];

            // Figure out what color to use
            indexOfColorToUse = _.indexOf(answers, answerToQuestion);
            color = settings.colorRange[indexOfColorToUse + 1];

            if (indexOfColorToUse == -1) {
              color = settings.colorRange[0];
            }

            style = settings.styleTemplate;
            style.color = color;
            style.fillColor = color;
          }
          
          // Use that style!
          this.renderObject(toRender, style);

        } else {

          if(_.has(geoInfo, "centroid")) {
            var toRender = {
              parcelId: response.get("parcel_id"),
              geometry: {
                "type": "Point",
                "coordinates": response.get("geo_info").centroid
              }
            };

            this.renderObject(toRender, settings.circleMarker);

          }
        }
      }, this);


      // fitBounds fails if there aren't any results, hence this test:
      try {
        console.log(this.objectsOnTheMap.getBounds());
        this.map.fitBounds(this.objectsOnTheMap.getBounds());
      }
      catch (e) {
        console.log(e);
      }
      
    },

    updateObjectStyles: function(style) {
      console.log("Changing style");
      this.objectsOnTheMap.setStyle(style);
    },
    
    // Expects an object with properties
    // obj.parcelId: ID of the given object
    // obj.geometry: GeoJSON geometry object
    renderObject: function(obj, style) {

      if(style === undefined) {
        style = this.defaultStyle;
      }

      // We don't want to re-draw parcels that are already on the map
      // So we keep a hash map with the layers so we can unrender them
      if(! _.has(this.parcelIdsOnTheMap, obj.parcelId) || obj.parcelId === ''){

        // Make sure the format fits Leaflet's geoJSON expectations
        obj.type = "Feature";

        // Mongo coordinates are reversed from Leaflet coordinates
        // AARGH.
        obj.geometry.coordinates = obj.geometry.coordinates.reverse();

        // Create a new geojson layer and style it. 
        var geojsonLayer = new L.geoJson(obj, {
            pointToLayer: function (feature, latlng) {
              return new L.circleMarker(latlng, style); 
            }
        });
        geojsonLayer.setStyle(style);
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
      if(this.filtered) {
        return;
      }

      // _kmq.push(['record', "Map zoomed"]);
      var zoom = this.map.getZoom();

      // Objects should be more detailed close up (zoom 10+) 
      if(zoom > 10) {

        // If we're in pretty close, show the satellite view
        if(zoom > 14) {
          if(this.googleLayer._type !== "HYBRID") {
            this.map.removeLayer(this.googleLayer);
            this.googleLayer = new L.Google("HYBRID");
            this.map.addLayer(this.googleLayer);
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
          if (this.googleLayer._type !== "TERRAIN") {
            // Show a more abstract map when zoomed out
            this.map.removeLayer(this.googleLayer);
            this.googleLayer = new L.Google("TERRAIN");
            this.map.addLayer(this.googleLayer);
          }
        }

      }else {
        // Far zoom (>14)
        // Show a more abstract map when zoomed out
        if (this.googleLayer._type !== "TERRAIN") {
          this.map.removeLayer(this.googleLayer);
          this.googleLayer = new L.Google("TERRAIN");
          this.map.addLayer(this.googleLayer);

          this.defaultStyle = settings.farZoomStyle;
          this.updateObjectStyles(settings.farZoomStyle);
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
      this.details(this.selectedLayer.feature.parcelId);
    },

    // When a parcel is clicked, show details for just that parcel. 
    details: function(parcelId) {
      console.log("Finding parcels " + parcelId);
      this.sel = new Responses.Collection(this.responses.where({'parcel_id': parcelId}));

      var selectedSingleObject = this.sel.toJSON()[0];
      selectedSingleObject.createdHumanized = moment(selectedSingleObject.created, "YYYY-MM-DDThh:mm:ss.SSSZ").format("MMM Do h:mma");

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