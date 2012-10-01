NSB.settings.api = {
  baseurl: '/api', // no trailing slash!
  geo: '/api',
};

NSB.settings.surveyId = null;
NSB.settings.slug = null;

// Basic map styles
NSB.settings.CheckIcon = L.Icon.extend({
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

NSB.settings.closeZoomStyle = {
  'color': '#f4eb4d', //'#cec40d'
  'opacity': 1,
  'weight': 2,
  'fillOpacity': 0,
  'fillColor': '#faf6ad'
};

NSB.settings.farZoomStyle = {
  'opacity': 1,
  'color': '#d7191c', //'#cec40d'
  'fillOpacity': 1,
  'fillColor': '#d7191c',
  'weight': 3
};

NSB.settings.selectedStyle = {
	'color': '#f4eb4d',
  'opacity': 1,
	'weight': 3,
	'fillOpacity': 0.5,
	'fillColor': '#faf6ad'
};

NSB.settings.googleMapsFarZoom = [
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