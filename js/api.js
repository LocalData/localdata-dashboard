NSB.API = new function() {  
  /*
   * Generates the URL to retrieve results for a given parcel
   */
  this.getSurveyURL = function() {
    return NSB.settings.api.baseurl + "/surveys/" + NSB.settings.surveyid;
  };
  
  this.getParcelDataURL = function(parcel_id) {
    return NSB.settings.api.baseurl + '/surveys/' + NSB.settings.surveyid + '/parcels/' + parcel_id + '/responses';
  };
  
  this.getGeoPointInfoURL = function(lat, lng) {
    return NSB.settings.api.geo + '/parcels/parcel?lat=' + lat + '&lng=' + lng;
  };
  
  this.getGeoBoundsObjectsURL = function(southwest, northeast) {
    return NSB.settings.api.geo + '/parcels/bounds?lowerleft=' + southwest.lat + "," + southwest.lng + "&topright=" + northeast.lat + "," + northeast.lng;
  };
  
  // Given a Leaflet latlng object, return a JSON object that describes the 
  // parcel.
  this.getObjectDataAtPoint = function(latlng, callback) {
    console.log("Waiting for PostGIS data");
    var lat = latlng.lat;
    var lng = latlng.lng; 
    
    var url = this.getGeoPointInfoURL(lat, lng);
    
    $.getJSON(url, function(data){
      // Process the results. Strip whitespace. Convert the polygon to geoJSON
      // TODO: This will need to be genercized (id column, addres, etc.)
      console.log("Got PostGIS data");
      callback(NSB.API.parseObjectData(data));
    }, this);
  };
  
  // Deal with the formatting of the geodata API.
  // In the future, this will be more genericized. 
  // parcel_id => object_id
  // address => object_location
  this.parseObjectData = function(data) {
    return {
      parcelId: data.parcelId, 
      address: data.address,
      polygon: data.polygon,
      centroid: data.centroid
    };
  };
  
  // Take an address string. 
  // Add "Detroit" to the end.
  // Return the first result as a lat-lng for convenience.
  // Or Null if Bing is being a jerk / we're dumb. 
  this.codeAddress = function(address, callback) {
    console.log("Coding an address");
    console.log(address);
    var detroitAddress = address + " Detroit, MI"; // for ease of geocoding
    var geocodeEndpoint = "http://dev.virtualearth.net/REST/v1/Locations/" + detroitAddress + "?o=json&key=" + NSB.settings.bing_key + "&jsonp=?";

    $.getJSON(geocodeEndpoint, function(data){
      if(data.resourceSets.length > 0){
        var point = data.resourceSets[0].resources[0].point;
        var latlng = new L.LatLng(point.coordinates[0], point.coordinates[1]);
        callback(latlng);
      };
    });    
  };
  
  // Take a map bounds object
  // Find the objects in the bounds
  // Feed those objects to the callback
  this.getResponsesInBounds = function(bounds, callback) {
    var southwest = bounds.getSouthWest();
    var northeast = bounds.getNorthEast();
    
    // Given the bounds, generate a URL to ge the responses from the API.
    serializedBounds = southwest.lat + "," + southwest.lng + "," + northeast.lat + "," + northeast.lng;
    var url = NSB.API.getSurveyURL() + "/responses/in/" + serializedBounds;

    // Give the callback the responses.
    $.getJSON(url, function(data){
      if(data.responses) {
        callback(data.responses);
      };
    });
  };
  
  // Take a map bounds object
  // Find the parcels in the bounds
  // Feed those objects to the callback
  this.getObjectsInBounds = function(bounds, callback) {
    bufferedBounds = addBuffer(bounds);
    var southwest = bufferedBounds.getSouthWest();
    var northeast = bufferedBounds.getNorthEast();
    
    // Given the bounds, generate a URL to ge the responses from the API.
    var url = this.getGeoBoundsObjectsURL(southwest, northeast);
    console.log(url);

    // Give the callback the responses.
    $.getJSON(url, function(data){
      if(data) {
        callback(data);
      };
    });
  };
    
  // Add a 100% buffer to a bounds object.
  // Makes parcels render faster when the map is moved
  var addBuffer = function(bounds) {    
    sw = bounds.getSouthWest();
    ne = bounds.getNorthEast();
    
    lngDiff = ne.lng - sw.lng;
    latDiff = ne.lat - sw.lat;
    
    lngMod = lngDiff;
    latMod = latDiff;
    
    var newSW = new L.LatLng(sw.lat - latMod, sw.lng - lngMod);
    var newNE = new L.LatLng(ne.lat + latMod, ne.lng + lngMod);
    
    return new L.LatLngBounds(newSW, newNE);
  };
  
};