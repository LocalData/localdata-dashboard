NSB.views.MapView = Backbone.View.extend({
  
  elId: "#map-view-container",
  map: null,
  responses: null,
  surveyId: null,
  paginationView: null,
  selectedLayer: null,
  selectedObject: {},
  
  initialize: function(options) {
    _.bindAll(this, 'render', 'selectObject', 'renderObject', 'renderObjects', 'getParcelsInBounds');
    
    
    this.responses = options.responses;
    
    this.parcelIdsOnTheMap = {};
    this.parcelsLayerGroup = new L.LayerGroup();
    
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
    
    var googleLayer = new L.Google("HYBRID");
    this.map.addLayer(googleLayer);  
    this.map.addLayer(this.parcelsLayerGroup);
    this.map.setView([42.35238776165833,-83.06136177185056], 19);
    
    this.getParcelsInBounds();  
    
    this.map.on('moveend', this.getParcelsInBounds);
  },
  
  renderObject: function(obj) {
    // We don't want to re-draw parcels that are already on the map
    // So we keep a hash map with the layers so we can unrender them
    if (! _.has(this.parcelIdsOnTheMap, obj.parcelId)){
     
      // Make sure the format fits Leaflet's geoJSON expectations
      obj['geometry'] = obj.polygon;
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
    if(zoom < 17) {
      return;
    }
    
    // If there are a lot of objects, let's reset.
    if( _.size(this.parcelIdsOnTheMap) > 1000 ) {
      this.parcelsLayerGroup.clearLayers();
      this.parcelIdsOnTheMap = {};
    };
    
    // Get parcel data in the bounds
    NSB.API.getObjectsInBounds(this.map.getBounds(), this.renderObjects); 
  },
  
  selectObject: function(event) {
    console.log("Layer clicked!");
    console.log(event);
    console.log(event.layer);
  
    // Deselect the previous layer, if any
    console.log(this);
    console.log(this.selectedLayer);
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