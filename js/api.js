/*jslint nomen: true */
/*globals define: true */

define(function (require) {
  'use strict';

  var settings = require('settings');
  var _ = require('lib/lodash');
  var $ = require('jquery');
  var L = require('lib/leaflet/leaflet');

  var api = {};

  // Check if the user is authenticated
  api.getUser = function(callback) {
    var url = settings.api.baseurl + "/user";

    $.getJSON(url, function(data) {
      callback(data);
    });
  };


  // Create a new survey
  api.createSurvey = function(survey, callback) {
    var url = "http://localhost:3000/api/surveys";

    console.log(url);

    var request = $.ajax({
      url: url,
      type: "POST",
      data: {"surveys": [survey]},
      dataType: "json"
    });

    request.done(function(surveys) {
      callback(surveys.surveys[0]);
    });

    request.fail(function(jqXHR, textStatus) {
      console.log("Request failed: " + textStatus);
    });
  };

  // Given a slug (eg 'just-a-surey'), find the corresponding survey 
  // Sets settings.surveyId
  api.setSurveyIdFromSlug = function(slug, callback) {    
    var url = settings.api.baseurl +  "/slugs/" + slug;
    console.log("Survey slug: " + url);
    
    // Save ourselves an ajax request
    if (settings.slug === slug && settings.surveyId !== null) {
      callback();
    }
    
    // TODO: Display a nice error if the survey wans't found.
    $.getJSON(url, function(data) {
      console.log("Survey Id: " + data.survey);
      settings.slug = slug;
      settings.surveyId = data.survey;
      callback();

    });
  };

  
  // Generates the URL to retrieve results for a given parcel
  api.getSurveyURL = function() {
    return settings.api.baseurl + "/surveys/" + settings.surveyId;
  };
  

  // Get the URL for a survey's resposnes
  api.getParcelDataURL = function(parcel_id) {
    return settings.api.baseurl + '/surveys/' + settings.surveyId + '/parcels/' + parcel_id + '/responses';
  };

    
  // Get the form for a surevy
  api.getForm = function(callback) {
    console.log("Getting form data");
    var url = api.getSurveyURL() + "/forms";
    
    console.log(url);

    $.getJSON(url, function(data){
      
      // Get only the mobile forms
      var mobileForms = _.filter(data.forms, function(form) {
        if (_.has(form, 'type')) {
          if (form.type === 'mobile'){
            return true;
          }
        }
        return false; 
      });
      settings.formData = mobileForms[0];
      
      console.log("Mobile forms");
      console.log(mobileForms);
      
      // Endpoint should give the most recent form first.
      callback();
    });
  };
    
  // Deal with the formatting of the geodata API.
  // In the future, this will be more genericized. 
  // parcel_id => object_id
  // address => object_location
  api.parseObjectData = function(data) {
    return {
      parcelId: data.parcelId, 
      address: data.address,
      polygon: data.polygon,
      centroid: data.centroid
    };
  };


  // Geodata stuff .............................................................
  api.getGeoBoundsObjectsURL = function(southwest, northeast) {
    return settings.api.geo + '/parcels?bbox=' + southwest.lng + "," + southwest.lat + "," + northeast.lng + "," + northeast.lat;
  };

  // Geocode an address  
  // Take an address string. 
  // Add "Detroit" to the end.
  // Return the first result as a lat-lng for convenience.
  // Or Null if Bing is being a jerk / we're dumb. 
  api.codeAddress = function(address, callback) {
    console.log("Coding an address");
    console.log(address);
    var detroitAddress = address + " Detroit, MI"; // for ease of geocoding
    var geocodeEndpoint = "http://dev.virtualearth.net/REST/v1/Locations/" + detroitAddress + "?o=json&key=" + settings.bing_key + "&jsonp=?";

    $.getJSON(geocodeEndpoint, function(data){
      if(data.resourceSets.length > 0){
        var point = data.resourceSets[0].resources[0].point;
        var latlng = new L.LatLng(point.coordinates[0], point.coordinates[1]);
        callback(latlng);
      }
    });    
  };
  
  // Get all the responses in a given bounding box
  // Take a map bounds object
  // Find the objects in the bounds
  // Feed those objects to the callback
  api.getResponsesInBounds = function(bounds, callback) {
    var southwest = bounds.getSouthWest();
    var northeast = bounds.getNorthEast();
    
    // Given the bounds, generate a URL to ge the responses from the API.
    var serializedBounds = southwest.lat + "," + southwest.lng + "," + northeast.lat + "," + northeast.lng;
    var url = api.getSurveyURL() + "/responses/in/" + serializedBounds;

    // Give the callback the responses.
    $.getJSON(url, function(data){
      if(data.responses) {
        callback(data.responses);
      }
    });
  };
  
  // Add a 100% buffer to a bounds object.
  // Makes parcels render faster when the map is moved
  var addBuffer = function(bounds) {    
    var sw = bounds.getSouthWest();
    var ne = bounds.getNorthEast();
    
    var lngDiff = ne.lng - sw.lng;
    var latDiff = ne.lat - sw.lat;
    
    var lngMod = lngDiff / 2;
    var latMod = latDiff / 2;
    
    var newSW = new L.LatLng(sw.lat - latMod, sw.lng - lngMod);
    var newNE = new L.LatLng(ne.lat + latMod, ne.lng + lngMod);
    
    return new L.LatLngBounds(newSW, newNE);
  };
  
  // Get all the objects in the map bounds from the GeoAPI
  // Take a map bounds object
  // Find the parcels in the bounds
  // Feed those objects to the callback
  api.getObjectsInBounds = function(bounds, callback) {
    var bufferedBounds = addBuffer(bounds);
    var southwest = bufferedBounds.getSouthWest();
    var northeast = bufferedBounds.getNorthEast();
    
    // Given the bounds, generate a URL to ge the responses from the API.
    var url = api.getGeoBoundsObjectsURL(southwest, northeast);
    console.log(url);

    // Give the callback the responses.
    $.getJSON(url, function(data){
      if(data) {
        callback(data);
      }
    });
  };
    
  return api;
});
