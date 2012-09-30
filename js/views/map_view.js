NSB.views.MapView = Backbone.View.extend({
  
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

    this.defaultStyle = NSB.settings.farZoomStyle;

    // Here, we set up the template so that re-renders only reset the 
    this.$el.html(_.template($('#map-view').html(), {}));
  
    this.map = new L.map('map');
    this.markers = {};
    
    this.googleLayer = new L.Google("TERRAIN");
    this.map.addLayer(this.googleLayer);  
    this.map.addLayer(this.parcelsLayerGroup);
    this.map.addLayer(this.doneMarkersLayerGroup);
    
    this.map.setView([42.374891,-83.069504], 17); // default center
    this.render();
  },  
  
  render: function() {  
    this.mapResponses();
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

    this.map.fitBounds(this.parcelsLayerGroup.getBounds());
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
    if(this.map.getZoom() > 14 ) {
      if (this.googleLayer._type !== "HYBRID") {
        // Show the satellite view when close in
        this.map.removeLayer(this.googleLayer);
        this.googleLayer = new L.Google("HYBRID");
        this.map.addLayer(this.googleLayer);

        // Objects should be more detailed close up
        this.defaultStyle = NSB.settings.closeZoomStyle;
        this.updateObjectStyles(NSB.settings.closeZoomStyle);
      }
    } else {
      if (this.googleLayer._type !== "TERRAIN") {
        // Show a more abstract map when zoomed out
        this.map.removeLayer(this.googleLayer);
        this.googleLayer = new L.Google("TERRAIN");
        this.map.addLayer(this.googleLayer);

        // Objects should be more abstract far out
        console.log("Updating styles!");
        console.log(NSB.settings.farZoomStyle);

        this.defaultStyle = NSB.settings.farZoomStyle;
        this.updateObjectStyles(NSB.settings.farZoomStyle);
      }
    }

    if (this.selectedLayer !== null) {
      this.selectedLayer.setStyle(NSB.settings.selectedStyle);
    };
  },
    
  renderObjects: function(results) {
    _.each(results, function(elt) { 
      this.renderObject(elt);   
    }, this); 
  },
  
  getParcelsInBounds: function() {
    // Don't add any parcels if the zoom is really far out. 
    zoom = this.map.getZoom();
    if(zoom < 16) {
      return;
    }
    
    // If there are a lot of objects, let's reset.
    if( _.size(this.parcelIdsOnTheMap) > 1250 ) {
      this.parcelsLayerGroup.clearLayers();
      this.parcelIdsOnTheMap = {};
    }
    
    // Get parcel data in the bounds
    NSB.API.getObjectsInBounds(this.map.getBounds(), this.renderObjects); 
  },
    
  // Adds a checkbox marker to the given point
  addDoneMarker: function(latlng, id) {
    // Only add markers if they aren't already on the map.

    if (true){ //this.markers[id] == undefined
      var doneIcon = new this.CheckIcon();
      var doneMarker = new L.Marker(latlng, {icon: doneIcon});
      this.doneMarkersLayerGroup.addLayer(doneMarker);
      this.markers[id] = doneMarker;
    }
  },
  
  addResultsToMap: function(results){    
    _.each(results, function(elt) {
      p = new L.LatLng(elt.geo_info.centroid[0], elt.geo_info.centroid[1]);
      id = elt.parcel_id;
      this.addDoneMarker(p, id);
    }, this);
  },
  
  // Get all the responses in a map 
  getResponsesInBounds: function(){  
    console.log("Getting responses in the map");
    
    // Don't add any markers if the zoom is really far out. 
    zoom = this.map.getZoom();
    if(zoom < 17) {
      return;
    }

    // Get the objects in the bounds
    // And add them to the map
    NSB.API.getResponsesInBounds(this.map.getBounds(), this.addResultsToMap);
  },
  
  selectObject: function(event) {
    _kmq.push(['record', "Map object selected"]);
    
    if (this.selectedLayer !== null) {
      this.selectedLayer.setStyle(this.defaultStyle);
    };
    
    // Select the current layer
    this.selectedLayer = event.layer;
    this.selectedLayer.setStyle(NSB.settings.selectedStyle);
    
    // Let's show some info about this object.
    // this.details(this.selectedLayer.feature.parcelId);
    
    // Let other parts of the app know that we've selected something.
    // $.publish("objectSelected");
  },
  
  details: function(parcelId) {
    console.log("Finding parcels " + parcelId);
    this.sel = new NSB.collections.Responses(this.responses.where({'parcel_id': parcelId}));

    console.log(this.sel);
    this.parcelView = new NSB.views.ResponseListView({
      elId: "#parceldeets",
      responses: this.sel
    });
    this.parcelView.render();
  }

});