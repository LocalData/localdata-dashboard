NSB.settings.api = {
  baseurl: 'http://surveyapidev.herokuapp.com/api', // http://localhost:3000/api', // 'http://surveydet.herokuapp.com', 
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
  'color': '#ffffff', //'#cec40d'
  'opacity': 1,
  'weight': 1.5,

  'fillColor': '#ffffff',
  'fillOpacity': 0.5
};

NSB.settings.farZoomStyle = {
  'opacity': 1,
  'color': '#d7191c', //'#cec40d'
  'fillOpacity': 1,
  'fillColor': '#d7191c',
  'weight': 3
};

NSB.settings.selectedStyle = {
  'opacity': 1,
  'color': '#f4eb4d',
  'fillOpacity': 0.5,
  'fillColor': '#faf6ad',
  'weight': 2
};