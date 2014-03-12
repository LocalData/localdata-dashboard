/*jslint nomen: true */
/*globals define: true */

define([
  // Libraries
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/leaflet.draw/leaflet.draw',
  'moment',
  'lib/tinypubsub',
  'lib/kissmetrics',

  // LocalData
  'settings',
  'api',

  // Models
  'models/zones',

  // Templates
  'text!templates/surveys/settings-map.html',
  'text!templates/surveys/settings-map-zones.html'
],

// https://github.com/LocalData/localdata-dashboard/compare/map-draw?expand=1

function($, _, Backbone, L, moment, events, _kmq, settings, api,
  Zones, MapDrawTemplate, MapZonesTemplate) {
  'use strict';

  var MapDrawView = Backbone.View.extend({
    map: null,

    el: "#map-draw-view-container",

    template: _.template(MapDrawTemplate),
    zonesTemplate: _.template(MapZonesTemplate),

    events: {
      'click .draw': 'drawZone',
      'click .remove': 'removeZone',
      'click .done': 'doneDrawingZone',
      'keyup #survey-zone-form input': 'updateName'
    },

    initialize: function(options) {
      _.bindAll(this,
        'render',
        'renderZones',
        'removeZone',
        'updateSurvey',
        'updateNames'
      );

      this.survey = options.survey;
      this.survey.on('change', this.render);

      this.zones = new Zones.Collection();
      this.zones.on('add', this.renderZones);
      this.zones.on('reset', this.renderZones);

      // TODO: listen to name changes
      this.zones.on('add', this.saveZones);

      this.render();
    },

    render: function() {
      // Don't re-render
      if(this.map) {
        return;
      }

      console.log("Rendering map draw view");
      this.$el.html(this.template({
        zones: this.survey.get('zones')
      }));

      // Initialize the map
      this.map = new L.map('map-draw', {
        maxZoom: 19
      });

      // Set up the base map
      this.baseLayer = new L.tileLayer(settings.baseLayer);
      this.map.addLayer(this.baseLayer);

      // Center on the survey
      // TODO: use geocoded center
      this.map.setView([42.374891,-83.069504], 17);

      // Initialize the FeatureGroup to store editable layers
      this.drawnItems = new L.FeatureGroup();
      this.map.addLayer(this.drawnItems);

      // Initialize the draw control and pass it the FeatureGroup of editable layers
      var drawControl = new L.Control.Draw({
          draw: {
            polyline: false,
            rectangle: false,
            circle: false,
            marker:false,
            polygon: {
              shapeOptions: {
                  color: '#ef6d4a',
                  fillColor: '#ef6d4a'
              }
            }
          },
          edit: {
              featureGroup: this.drawnItems
          }
      });
      this.map.addControl(drawControl);

      this.map.on('draw:created', function (e) {
        var type  = e.layerType,
            layer = e.layer;

        // Style zones with a unique color
        // TODO: we only have 6 colors right now.
        var zoneNumber = this.zones.length;
        var color = settings.colorRange[zoneNumber + 1];
        layer.setStyle({
          color: color,
          fillColor: color
        });

        // Create a new zone model
        var geoJSON = layer.toGeoJSON();
        console.log("GeoJSON", geoJSON);
        geoJSON.properties = {
          layer: layer,
          name: 'Zone ' + (this.zones.length + 1),
          color: color
        };
        var zone = new Zones.Model(geoJSON);
        this.zones.push(zone);

        // Add the zone layer to the layerGroup
        this.drawnItems.addLayer(layer);
      }.bind(this));

      if(this.survey.zones) {
        this.renderZones();
      }
    },

    /**
     * Render surveyor zones on the map
     */
    renderZones: function() {
      console.log("Zone added!");
      if(_.has(this.survey, 'zones')) {
        this.zones.reset(this.survey.zones.features);
      }

      // Show the form for the zones
      console.log(this.zones.toJSON());
      $('#map-zones').html(this.zonesTemplate({
        zones: this.zones.toJSON()
      }));

      $('input[type=text]').on('keyup', this.updateNames);
    },

    updateName: function(event) {
      // TODO: Update name
      this.updateSurvey();
    },

    updateNames: function() {
      // Update the zone names
      // TODO: just listen to each input
      $('#survey-zone-form input').each(function(index, $input) {
        console.log(this.zones, this.zones.at(index), index);
        this.zones.at(index).attributes.properties.name = $input.value;
      }.bind(this));
      this.updateSurvey();
    },

    /**
     * Save the zones that are on the map
     */
    // saveZones: function() {
    //   // Save the zone to the survey
    //   console.log(this.survey);
    //   this.survey.save();
    // },

    /**
     * Remove a zone from the survey
     * TODO
     */
    removeZone: function(event) {
      // Delete it from the survey

      // Delete it from the map

      // Save the survey
    },

    /**
     * Remove a zone from the survey
     */
    updateSurvey: function() {
      var zones = this.survey.get('zones');
      console.log("Got zones", zones);
      zones.features = this.zones.toJSON();
      this.survey.set('zones', zones);
      console.log("Set zones", this.survey);
    },

    getZones: function() {
      return this.zones.toJSON();
    }

  });

  return MapDrawView;

});
