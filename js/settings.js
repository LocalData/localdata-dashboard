/*jslint nomen: true */
/*globals define: true */

define([
  'lib/leaflet/leaflet.google'
],

function(L) {
  'use strict';
  
  var settings = {};

  settings.api = {
    baseurl: 'http://localhost:3000/api', // http://localhost:3000/api', // 'http://surveydet.herokuapp.com', 
    geo: 'http://localhost:3000/api' //'http://surveydet.herokuapp.com/api',
  };

  // These get set by the app. 
  // Really should be tracked elsewhere. 
  // Are they even used? Let's comment them out and see what breaks. 
  // settings.surveyId = null;
  // settings.slug = null;

  // Basic map styles
  settings.CheckIcon = L.Icon.extend({
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

  // Basic map styles

  settings.closeZoomStyle = {
    'color': '#ef6d4a', //'#cec40d'
    'opacity': 1,
    'weight': 2,
    'fillOpacity': 0.5,
    'fillColor': '#ef6d4a'
  };

  settings.farZoomStyle = {
    'opacity': 1,
    'fillOpacity': 1,
    'fillColor': '#ef6d4a',
    'weight': 0
  };

  settings.selectedStyle = {
    'color': '#fcd96c',
    'opacity': 1,
    'weight': 3,
    'fillOpacity': 0.5,
    'fillColor': '#fcd96c'
  };

  settings.googleMapsFarZoom = [
    {
      "elementType": "geometry",
      "stylers": [
        { "lightness": 40 },
        { "gamma": 1.33 },
        { "saturation": -52 },
        { "hue": "#00fff7" }
      ]
    }
  ];

  return settings;
});
