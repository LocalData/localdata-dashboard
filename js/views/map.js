/*jslint nomen: true */
/*globals define: true */

define([
  // Libraries
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/leaflet/leaflet.google',
  'moment',

  // LocalData
  'settings',
  'api',

  // Models
  'models/responses'
],

function($, _, Backbone, L, moment, settings, api, Responses) {
  'use strict'; 
  
  var MapView = Backbone.View.extend({

    map: null,
    responses: null,
    surveyId: null,
    paginationView: null,
    selectedLayer: null,
    selectedObject: {},
    markers: {},  
    
    initialize: function(options) {
      console.log("Init map view");
      _.bindAll(this, 'render', 'selectObject', 'renderObject', 'renderObjects', 'getResponsesInBounds', 'addDoneMarker', 'addResultsToMap', 'updateMapStyleBasedOnZoom', 'updateObjectStyles');
      
      this.responses = options.responses;
      this.responses.on('reset', this.render, this);

      this.parcelIdsOnTheMap = {};
      this.parcelsLayerGroup = new L.FeatureGroup();
      this.doneMarkersLayerGroup = new L.FeatureGroup();

      this.defaultStyle = settings.farZoomStyle;

      this.$el.html(_.template($('#map-view').html(), {}));
    
      this.map = new L.map('map');
      this.markers = {};
      
      console.log(L);

      this.googleLayer = new L.Google("TERRAIN");
      this.map.addLayer(this.googleLayer);  
      this.map.addLayer(this.parcelsLayerGroup);
      this.map.addLayer(this.doneMarkersLayerGroup);
      
      this.map.setView([42.374891,-83.069504], 17); // default center
      this.render();
    },  
    
    render: function() {  
      // TODO: better message passing
      // NSB.setLoading(true);
      this.mapResponses();
      // NSB.setLoading(false);
    },

    mapResponses: function() {
      // Clear out all the old results
      this.parcelsLayerGroup.clearLayers();

      _.each(this.responses.models, function(response){
        // Skip old records that don't have geo_info
        var geoInfo = response.get("geo_info");
        if (geoInfo === undefined) {
          return;
        }

        // Make sure were have the geometry for this parcel
        if(_.has(geoInfo, "geometry")) {
          this.renderObject({
            parcelId: response.get("parcel_id"),
            geometry: response.get("geo_info").geometry 
          });
        }

      }, this);


      // fitBounds fails if there aren't any results, hence this test:
      try {
        this.map.fitBounds(this.parcelsLayerGroup.getBounds());
      }
      catch (e) {
        // statements to handle any exceptions
        console.log(e); // pass exception object to error handler
      }
      
    },

    updateObjectStyles: function(style) {
      this.parcelsLayerGroup.setStyle(style);
    },
    
    renderObject: function(obj) {
      // We don't want to re-draw parcels that are already on the map
      // So we keep a hash map with the layers so we can unrender them

      if(! _.has(this.parcelIdsOnTheMap, obj.parcelId)){
       
        // Make sure the format fits Leaflet's geoJSON expectations
        // obj['geometry'] = obj.polygon;
        obj.type = "Feature";
        obj.geometry.type = "Polygon";

        if(obj.geometry.coordinates[0][0].length > 2) {
          obj.geometry.type = "MultiPolygon";
        }
        // obj.geometry.coordinates

        // Create a new geojson layer and style it. 
        var geojsonLayer = new L.GeoJSON();
        geojsonLayer.addData(obj);
        geojsonLayer.setStyle(this.defaultStyle);
        
        geojsonLayer.on('click', this.selectObject);
        
        // Add the layer to the layergroup and the hashmap
        this.parcelsLayerGroup.addLayer(geojsonLayer);
        this.parcelIdsOnTheMap[obj.parcelId] = geojsonLayer;

        this.map.on('zoomend', this.updateMapStyleBasedOnZoom);
      }
    },

    updateMapStyleBasedOnZoom: function(e) {
      // _kmq.push(['record', "Map zoomed"]);
      
      if(this.map.getZoom() > 14 ) {
        if (this.googleLayer._type !== "HYBRID") {
          // Show the satellite view when close in
          this.map.removeLayer(this.googleLayer);
          this.googleLayer = new L.Google("HYBRID");
          this.map.addLayer(this.googleLayer);

          // Objects should be more detailed close up
          this.defaultStyle = settings.closeZoomStyle;
          this.updateObjectStyles(settings.closeZoomStyle);
        }
      } else {
        if (this.googleLayer._type !== "TERRAIN") {
          // Show a more abstract map when zoomed out
          this.map.removeLayer(this.googleLayer);
          this.googleLayer = new L.Google("TERRAIN");
          this.map.addLayer(this.googleLayer);

          // Objects should be more abstract far out
          console.log("Updating styles!");
          console.log(settings.farZoomStyle);

          this.defaultStyle = settings.farZoomStyle;
          this.updateObjectStyles(settings.farZoomStyle);
        }
      }

      if (this.selectedLayer !== null) {
        this.selectedLayer.setStyle(settings.selectedStyle);
      }
    },
      
    renderObjects: function(results) {
      _.each(results, function(elt) { 
        this.renderObject(elt);   
      }, this); 
    },
    
    getParcelsInBounds: function() {
      // Don't add any parcels if the zoom is really far out. 
      var zoom = this.map.getZoom();
      if(zoom < 16) {
        return;
      }
      
      // If there are a lot of objects, let's reset.
      if( _.size(this.parcelIdsOnTheMap) > 1250 ) {
        this.parcelsLayerGroup.clearLayers();
        this.parcelIdsOnTheMap = {};
      }
      
      // Get parcel data in the bounds
      api.getObjectsInBounds(this.map.getBounds(), this.renderObjects); 
    },
      
    // TODO 
    // Adds a checkbox marker to the given point
    addDoneMarker: function(latlng, id) {
      // Only add markers if they aren't already on the map.
      // if (true){ //this.markers[id] == undefined
      //   var doneIcon = new this.CheckIcon();
      //   var doneMarker = new L.Marker(latlng, {icon: doneIcon});
      //   this.doneMarkersLayerGroup.addLayer(doneMarker);
      //   this.markers[id] = doneMarker;
      // }
    },
    
    addResultsToMap: function(results){    
      _.each(results, function(elt) {
        var point = new L.LatLng(elt.geo_info.centroid[0], elt.geo_info.centroid[1]);
        var id = elt.parcel_id;
        this.addDoneMarker(point, id);
      }, this);
    },
    
    // Get all the responses in a map 
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
      
      // TODO
      // Let other parts of the app know that we've selected something.
      // $.publish("objectSelected");
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