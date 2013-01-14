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

  // Create a new user 
  // 
  // @param {Object} user Name, email, and password for the user
  // @param {Function} callback Parameters: (error, user)
  api.createUser = function(user, callback) {

    var url = settings.api.baseurl + "/user";

    var request = $.ajax({
      url: url,
      type: "POST",
      data: user,
      dataType: "json"
    });

    request.done(function(user) {
      callback(null, user);
    });

    request.fail(function(jqXHR, textStatus, errorThrown) {
      console.log("Request failed: ", jqXHR);
      callback(jqXHR.responseText, null);
    });
  };


  // Log a user in 
  // 
  // @param {Object} user Email and password for the user
  // @param {Function} callback Parameters: (error, user)
  api.logIn = function(user, callback) {

    var url = settings.api.baseurl + "/login"

    var request = $.ajax({
      url: url,
      type: "POST",
      data: user,
      dataType: "json"
    });

    request.done(function(response) {
      console.log(response);
      if(response.name === "BadRequestError") {
        callback(response, null);
        return;
      }
      callback(null, response);
    });

    request.fail(function(jqXHR, textStatus, errorThrown) {
      console.log("Request failed: ", jqXHR.responseText);
      callback(jqXHR.responseText, null);
    });

  }

  // Create a new survey
  api.createSurvey = function(survey, callback) {
    var url = settings.api.baseurl + "/surveys";

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


  // Find a survey by slug
  // Given a slug (eg 'just-a-surey') Sets settings.surveyId
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

  
  // Generates the URL for the current survey
  // (Current survey is set by setSurveyIdFromSlug, above)
  api.getSurveyURL = function() {
    return settings.api.baseurl + "/surveys/" + settings.surveyId;
  };
  

  // Generates the URL for the current survey's resposnes
  api.getParcelDataURL = function(parcel_id) {
    return settings.api.baseurl + '/surveys/' + settings.surveyId + '/parcels/' + parcel_id + '/responses';
  };

    
  // Get the form for the urrent survey
  api.getForm = function(callback) {
    console.log("API: getting form data");
    var url = api.getSurveyURL() + "/forms";

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
      
      console.log("API: mobile forms: ", mobileForms);
      
      // Endpoint should give the most recent form first.
      callback();
    });
  };

  // Add a form form to a survey
  api.createForm = function(form, callback, options) {
    console.log("API: creating a form");
    var key;

    // Add the form to the current survey
    // Or, if a custom surveyId is defined in options, use that. 
    var surveyId = settings.surveyId;
    if(_.has(options, "surveyId")) {
      surveyId = options.surveyId;
    }

    var url = settings.api.baseurl + '/surveys/' + surveyId + '/forms/';
    var data = { "forms": [ form ] };

    // Post the form data
    $.post(url, data, function() {}, "text").error(function(){ 
        console.log("Error posting form:");
    }).success(function(){
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


  // TODO: Get a short URL for a survey from 
  // api.getShortURL = function(long_url, login, api_key, func){ 
  //   $.getJSON(
  //     "http://api.bitly.com/v3/shorten?callback=?", 
  //     { 
  //         "format": "json",
  //         "apiKey": api_key,
  //         "login": login,
  //         "longUrl": long_url
  //     },
  //     function(response)
  //     {
  //         func(response.data.url);
  //     }
  //   );
  // };

    
  return api;
});
