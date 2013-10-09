/*jslint nomen: true */
/*globals define: true */

define([
  'lib/leaflet/leaflet.google'
],

function(L) {
  'use strict';

  var settings = {};

  settings.api = {
    baseurl: '/api', // http://localhost:3000/api',
    geo: '/api'
  };

  settings.baseLayer = 'http://a.tiles.mapbox.com/v3/matth.map-n9bps30s/{z}/{x}/{y}.png';

  // Colors for option maps
  settings.colorRange = [
    "#b7aba5", // First color used for blank entries
    "#a743c3",
    "#58aeff",
    "#00ad00",
    "#ffad00",
    "#f15a24"
  ];

  settings.circleMarker = {
    radius: 8,
    fillColor: "#df455d",
    color: "#df455d",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  };

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

  // Just add color! (and fillColor)
  settings.styleTemplate = {
    'opacity': 1,
    'weight': 2,
    'fillOpacity': 0.5
  };

  settings.closeZoomStyle = {
    'color': '#a743c3',
    'opacity': 1,
    'weight': 2,
    'fillOpacity': 0.5,
    'fillColor': '#a743c3'
  };

  settings.midZoomStyle = {
    'color': '#a743c3',
    'opacity': 0.4,
    'weight': 1,
    'fillOpacity': 0.5,
    'fillColor': '#a743c3'
  };

  settings.farZoomStyle = {
    'color': '#a743c3',
    'opacity': 0.9,
    'fillOpacity': 0.9,
    'fillColor': '#a743c3',
    'weight': 1
  };

  settings.selectedStyle = {
    'color': '#fcd96c',
    'opacity': 1,
    'weight': 3,
    'fillOpacity': 0.5,
    'fillColor': '#fcd96c'
  };

  return settings;
});
