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
  settings.GoogleKey = 'AIzaSyCO654zBIabvjSOV4Ys59Pku8pmzM387ps';

  settings.baseLayer = '//{s}.tiles.mapbox.com/v3/matth.map-n9bps30s/{z}/{x}/{y}.png'; // LocalData
  //settings.baseLayer = '//a.tiles.mapbox.com/v3/matth.kmf6l3h1/{z}/{x}/{y}.png'; // MapBox default
  settings.satelliteLayer = '//a.tiles.mapbox.com/v3/matth.map-yyr7jb6r/{z}/{x}/{y}.png';
  settings.printLayer = 'http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png';

  settings.MIN_GRID_ZOOM = 14; // furthest out we'll have interactive grids.

  // Colors for option maps
  settings.colorRange = [
    "#b7aba5", // First color used for blank entries
    "#a743c3", // purple
    "#f15a24", // red
    "#58aeff", // blue
    "#00ad00", // green
    "#ffad00", // orange-yellow
    "#6e6663", // dark gray
    "#0049ad"  // dark blue
  ];

  settings.zoneColors = [
    '#a743c3',
    '#f15a24',
    '#58aeff',
    '#00ad00',
    '#ffad00',
    '#b7aba5',
    '#cc4685',
    '#666666',
    '#8516a4',
    '#ef152e',
    '#0b89ff',
    '#009300',
    '#1e78c8',
    '#14b85f'
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
