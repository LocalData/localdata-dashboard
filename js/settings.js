NSB.settings.api = {
  baseurl: 'http://localhost:3000/api', // http://localhost:3000/api', // 'http://surveydet.herokuapp.com', 
  geo: 'http://localhost:3000/api' //'http://surveydet.herokuapp.com/api',
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
  'fillOpacity': 1,
  'fillColor': '#d7191c',
  'weight': 0
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
