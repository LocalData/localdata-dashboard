/*jslint nomen: true */
/*globals define: true */

define([
  'lib/leaflet/leaflet.tilejson'
],

function(L) {
  'use strict';

  var settings = {};

  settings.api = {
    baseurl: '/api', // http://localhost:3000/api',
    geo: '/api'
  };

  settings.BingKey = 'Arc0Uekwc6xUCJJgDA6Kv__AL_rvEh4Hcpj4nkyUmGTIx-SxMd52PPmsqKbvI_ce';

  //settings.baseLayer = '//a.tiles.mapbox.com/v3/matth.map-n9bps30s/{z}/{x}/{y}.png';
  //settings.baseLayer = 'http://a.tiles.mapbox.com/v3/matth.i60j31k6/{z}/{x}/{y}.png';
  settings.baseLayer = '//2.base.maps.cit.api.here.com/maptile/2.1/maptile/newest/reduced.night/{z}/{x}/{y}/256/png8?app_id=bcY173ntrZWClcXRW3Uh&app_code=zSczWHEAuJaFBJlkQ83Dhg';
  settings.satelliteLayer = '//a.tiles.mapbox.com/v3/matth.map-yyr7jb6r/{z}/{x}/{y}.png';
  settings.printLayer = 'http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png';

  // Colors for option maps
  settings.colorRange = [
    "#b7aba5", // First color used for blank entries
    "#a743c3",
    "#f15a24",
    "#58aeff",
    "#00ad00",
    "#ffad00"
  ];

  settings.circleMarker = {
    radius: 5,
    fillColor: "#0062be",
    color: "#fff",
    weight: 2,
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
