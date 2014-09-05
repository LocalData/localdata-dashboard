/*jslint nomen: true */
/*globals define, cartodb, Rickshaw: true */

define(function (require) {
  'use strict';

  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');
  var L = require('lib/leaflet/leaflet.tilejson');
  var cartodb = require('cartodb');
  var Rickshaw = require('Rickshaw');

  // LocalData
  var settings = require('settings');

  // Templates
  var template = require('text!templates/projects/layerControl.html');

  cartodb = window.cartodb;

  // Generate a query URL
  // A sample URL might look like this:
  //  http://ags.wingis.org/ArcGIS/rest/services/1_Parcels/MapServer/1/query?
  //  geometryType=esriGeometryEnvelope
  //  &geometry=-89.097769,42.271545,-89.092362,42.274038
  //  &f=json&outFields=*&inSR=4326
  //
  // Sample options might looks like this:
  // {
  //   "type": "ArcGIS Server",
  //   "endpoint": "http://ags.wingis.org/ArcGIS/rest/services/1_Parcels/MapServer/1/",
  //   "name": ["LOPHouseNumber", "LOPPrefixDirectional", "LOPStreetName"],
  //   "id": "PrimaryPIN"
  // }
  //
  // @param {Object} bbox A bounding box specified as an array of coordinates:
  // [[west, south], [east, north]]
  // @param {Object} options Options for the query. Must include:
  //    endpoint: the URL of the needed Arc Server collection
  //    id: the primary ID for each location (eg, parcel ID)
  function generateArcQueryURL(bbox, options) {
    var url = options.endpoint;

    // Set the requested fields
    var outFields = _.reduce(options.name, function(memo, field){ return memo + ',' + field; }, options.id);
    url += 'query?' + 'outFields=*';

    // Add the geometry query
    // Given the bounding box, generate a URL to ge the responses from the API.
    var serializedBounds = bbox.join(',');

    url += '&geometryType=esriGeometryEnvelope';
    url += '&geometry=' + serializedBounds;

    // We want JSON back
    url += '&f=json';

    // Make sure the server know's we're sending EPSG 4326
    // And that we want to get the same back
    url += '&inSR=4326';
    url += '&outSR=4326';

    // And finally, set a callback:
    url += '&callback=?';

    console.log(url);
    return url;
  }

  // Generate GeoJSON from ESRI's JSON data format
  //
  // @param {Array} geometry A list of features from a geoserver
  function generateGeoJSONFromESRIGeometry(geometry) {
    var multiPolygon = {
      type: 'MultiPolygon',
      coordinates: []
    };

    _.each(geometry.rings, function(ring) {
      multiPolygon.coordinates.push([ring]);
    });

    return multiPolygon;
  }

  // Given a map bounding box, get the objects in the bbox from the given ESRI
  // server.
  //
  // @param {Object} bbox A bounding box specified as an array of coordinates:
  // [[west, south], [east, north]]
  // @param {Function} callback With two parameters, error and results, a
  // GeoJSON FeatureCollection
  function getObjectsInBBoxFromESRI(bbox, options, callback) {
    var url = generateArcQueryURL(bbox, options);

    // Get geo objects from the ArcServer API. Don't force non-caching on IE,
    // since these should rarely change and could be requested multiple times
    // in a session.
    $.ajax({
      url: url,
      dataType: 'json',
      success: function (data){
        if(data) {
          // Create a GeoJSON FeatureCollection from the ESRI-style data.
          var featureCollection = {
            type: 'FeatureCollection'
          };
          featureCollection.features = _.map(data.features, function (item) {
            return {
              type: 'Feature',
              id: item.attributes[options.id],
              geometry: generateGeoJSONFromESRIGeometry(item.geometry),
              properties: { }
            };
          });

          // Pass the FeatureCollection to the callback.
          callback(null, featureCollection);
        } else {
          callback({
            type: 'APIError',
            message: 'Got no data from the Arc Server endpoint'
          });
        }
      }
    });

  }


  var LayerControl = Backbone.View.extend({
    template: _.template(template),

    className: 'layer',

    initialize: function(options) {
      _.bindAll(this,
        'setup',
        'render',
        'update',
        'getCount',
        'processData',
        'doneLoading'
      );
      this.map = options.map;
      this.setup();
    },

    update: function(options) {
      //this.setup();
    },

    /**
     * Set up the map and chart data
     * @param  {Object} options
     */
    setup: function() {
      var self = this;
      $.ajax({
        url: '//comfortless.herokuapp.com/?url=' + encodeURIComponent('http://youarehere.cc/p/static/data/San%20Francisco/bicycle_accidents/final_data3.json')
      }).done(function (data) {
        self.processData(data);
      }).fail(function (error) {
        console.log(error);
      });
    },

    processData: function(data) {
      this.data = {
        type: 'FeatureCollection',
        features: _.map(data.accidents, function (item) {
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [item.lng, item.lat]
            }
          };
        })
      };
      this.layer = L.geoJson(this.data, {
        pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, _.defaults({
            fillColor: '#f14',
            radius: 10
          }, settings.circleMarker));
        }
      });
      this.layer.addTo(this.map);
      this.render();
    },

    doneLoading: function() {
      this.$el.find('.loading').hide();
    },

    /**
     * Get the number of responses
     * @return {String}
     */
    getCount: function() {
      if(this.data) {
        return this.data.features.length;
      }
      return '';
    },

    render: function() {
      console.log("Rendering layerControl", this.$el);
      var context = {
        name: 'Bike fatalaties',
        kind: 'total fatalaties',
        meta: {
          count: this.getCount()
        }
      };

      this.$el.html(this.template(context));

      if(this.data) {
        this.doneLoading();
      }

      return this.$el;
    }
  });

  return LayerControl;

});
