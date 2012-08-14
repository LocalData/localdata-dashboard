NSB.views.MapView = Backbone.View.extend({
  
  elId: "#body",
  responses: null,
  surveyId: null,
  paginationView: null,
  
  parcelIdsOnTheMap: {},
  parcelsLayerGroup: new L.LayerGroup(),
  

  initialize: function(options) {
    _.bindAll(this, 'render', 'renderParcelsInBounds');
    // this.responses = options.responses;
    // this.responses.on('all', this.render, this);
  },  
  
  render: function() {  
    console.log("Rendering map view");
      
    $(this.elId).html(_.template($('#map-view').html(), {}));
    
    // Set up the map with Google Maps
    this.map = new L.map('map');
    
        
    var googleLayer = new L.Google("TERRAIN");
    this.map.addLayer(googleLayer);  
    this.map.addLayer(this.parcelsLayerGroup);
    this.map.setView([42.331427,-83.045754], 13);
    
    this.renderParcelsInBounds();  
  },
  
  renderParcelsInBounds: function() {
    console.log("Rendering parcels in bounds");
    
    // Don't add any parcels if the zoom is really far out. 
    // zoom = map.getZoom();
    // if(zoom < 17) {
    //   return;
    // }
    
    // TODO: If we have too many objects, let's delete them
    console.log(this.parcelsLayerGroup);
    
    // Get parcel data in the bounds
    NSB.API.getObjectsInBounds(this.map.getBounds(), function(results) {
      console.log("Received parcel data");
      
      $.each(results, function(key, elt) {    
        
        // We don't want to re-draw parcels that are already on the map
        // So we keep a hash map with the layers so we can unrender them
        if (this.parcelIdsOnTheMap[elt.parcelId] == undefined){
         
          // Make sure the format fits Leaflet's geoJSON expectations
          elt['geometry'] = elt.polygon;
          elt['type'] = "Feature";

          // Create a new geojson layer and style it. 
          var geojsonLayer = new L.GeoJSON();
          geojsonLayer.addGeoJSON(elt);
          geojsonLayer.setStyle(defaultStyle);
          
          geojsonLayer.on('click', function(e){ 
          
            // Deselect the previous layer, if any
            if (selectedLayer != null) {
              selectedLayer.setStyle(defaultStyle);
            };
            
            // Keep track of the selected object centrally
            NSB.selectedObject.id = elt['parcelId'];
            NSB.selectedObject.humanReadableName = elt['address'];
            NSB.selectedObject.centroid = elt['centroid'];
            NSB.selectedObject.geometry = elt['geometry']; 
            console.log(NSB.selectedObject);
            
            // Select the current layer
            selectedLayer = e.layer;
            selectedLayer.setStyle(selectedStyle);
            
            // Let other parts of the app know that we've selected something.
            $.publish("objectSelected");
          });
          
          console.log("Adding layer to the map");
          // Add the layer to the layergroup and the hashmap
          this.parcelsLayerGroup.addLayer(geojsonLayer);
          this.parcelIdsOnTheMap[elt.parcelId] = geojsonLayer;
        };
      });
    });
  }
  
});