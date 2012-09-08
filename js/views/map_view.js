NSB.views.MapView = Backbone.View.extend({
  
  elId: "#map-view-container",
  map: null,
  responses: null,
  surveyId: null,
  paginationView: null,
  selectedLayer: null,
  selectedObject: {},
  markers: {},  
  
  initialize: function(options) {
    _.bindAll(this, 'render', 'selectObject', 'renderObject', 
      'renderObjects', 'getParcelsInBounds', 'getResponsesInBounds', 'addDoneMarker',
      'addResultsToMap');
    
    this.responses = options.responses;
    this.responses.on('all', this.mapResponses, this);
    
    this.parcelIdsOnTheMap = {};
    this.parcelsLayerGroup = new L.FeatureGroup();
    this.doneMarkersLayerGroup = new L.FeatureGroup();
    
    this.CheckIcon = L.Icon.extend({
      options: {
        className: 'CheckIcon',
        iconUrl: 'img/icons/check-16.png',
        shadowUrl: 'img/icons/check-16.png',
        iconSize: new L.Point(16, 16),
        shadowSize: new L.Point(16, 16),
        iconAnchor: new L.Point(8, 8),
        popupAnchor: new L.Point(8, 8)
      }
    });
    
    this.defaultStyle = {
      'opacity': 1,
      'fillOpacity': 0,
      'weight': 1.5,
      'color': '#cec40d'
    };
    
    this.selectedStyle = {
      'opacity': 1,
      'fillOpacity': 0.5,
      'fillColor': '#faf6ad',
      'weight': 1.5,
      'color': '#f4eb4d'
    };
  },  
  
  render: function() {  
    console.log("Rendering map view");
    $(this.elId).html(_.template($('#map-view').html(), {}));
    
    // Set up the map with Google Maps
    this.map = new L.map('map');
    this.markers = {};
    
    var googleLayer = new L.Google("HYBRID");
    this.map.addLayer(googleLayer);  
    this.map.addLayer(this.parcelsLayerGroup);
    this.map.addLayer(this.doneMarkersLayerGroup);
    
    this.map.setView([42.374891,-83.069504], 17);
    
    // this.getParcelsInBounds();  
    // this.getResponsesInBounds();  

    // this.map.on('moveend', this.getParcelsInBounds);
    // this.map.on('moveend', this.getResponsesInBounds);
  },

  mapResponses: function() {
    console.log(this.responses);

    _.each(this.responses.models, function(response){
      // Make sure we have the geometry for this parcel
      console.log(response);
      console.log(response.get("geo_info").geometry);
      if(_.has(response.get("geo_info"), "geometry")) {
        this.renderObject({
          parcelId: response.get("parcel_id"),
          geometry: response.get("geo_info").geometry
        });
      }

    }, this);

    this.map.fitBounds(this.parcelsLayerGroup.getBounds());

  },
  
  renderObject: function(obj) {
    // We don't want to re-draw parcels that are already on the map
    // So we keep a hash map with the layers so we can unrender them
    if (! _.has(this.parcelIdsOnTheMap, obj.parcelId)){

      console.log(obj);
     
      // Make sure the format fits Leaflet's geoJSON expectations
      // obj['geometry'] = obj.polygon;
      obj['type'] = "Feature";
  
      // Create a new geojson layer and style it. 
      var geojsonLayer = new L.GeoJSON();
      geojsonLayer.addData(obj);
      geojsonLayer.setStyle(this.defaultStyle);
      
      geojsonLayer.on('click', this.selectObject);
      
      console.log("Adding layer to the map");
      // Add the layer to the layergroup and the hashmap
      this.parcelsLayerGroup.addLayer(geojsonLayer);
      this.parcelIdsOnTheMap[obj.parcelId] = geojsonLayer;
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
    };
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
    
    if (this.selectedLayer != null) {
      this.selectedLayer.setStyle(this.defaultStyle);
    };
    
    // Select the current layer
    this.selectedLayer = event.layer;
    this.selectedLayer.setStyle(this.selectedStyle);
    
    // Let's show some info about this object.
    this.details(this.selectedLayer.feature.parcelId);
    
    // Let other parts of the app know that we've selected something.
    // $.publish("objectSelected");
  },
  
  details: function(parcelId) {
    console.log("Filtering for " + parcelId);
    this.sel = new NSB.collections.Responses();
    this.sel.add(this.responses.where({'parcel_id': parcelId}));
    
    console.log(this.sel);
    this.parcelView = new NSB.views.ResponseListView({
      elId: "#parceldeets",
      responses: this.sel
    });
    this.parcelView.render();
  }

});