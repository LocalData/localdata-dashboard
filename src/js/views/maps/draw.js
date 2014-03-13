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

  function flip(a) {
    return [a[1], a[0]];
  }

  var MapDrawView = Backbone.View.extend({
    map: null,

    el: "#map-draw-view-container",

    template: _.template(MapDrawTemplate),
    zonesTemplate: _.template(MapZonesTemplate),

    events: {
      'click .draw': 'drawZone',
      'click .remove': 'removeZone',
      'click .done': 'doneDrawingZone'
    },

    initialize: function(options) {
      _.bindAll(this,
        'render',
        'fitBounds',
        'addZone',
        'renderZones',
        'getZones'
      );

      this.survey = options.survey;
      this.survey.on('change', this.render);

      this.zones = new Zones.Collection();

      // TODO: listen to name changes
      this.zones.on('add', this.saveZones);
      this.zones.on('remove', this.unmapZone);

      this.render();
    },

    render: function() {
      // Don't re-render
      if(this.map) {
        return;
      }

      this.$el.html(this.template());

      // Initialize the map
      this.map = new L.map('map-draw', {
        maxZoom: 19
      });

      // Set up the base map
      this.baseLayer = new L.tileLayer(settings.baseLayer);
      this.map.addLayer(this.baseLayer);

      // Center on the survey
      // TODO: use geocoded center
      this.fitBounds();

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

      this.map.on('draw:created', this.addZone);

      // Add existing zones
      this.zones.reset(this.survey.get('zones'));
      this.renderZones();
    },

    fitBounds: function() {
      var bounds = this.survey.get('responseBounds');
      if (bounds) {
        bounds = [flip(bounds[0]), flip(bounds[1])];
        if (bounds[0][0] === bounds[1][0] || bounds[0][1] === bounds[1][1]) {
          this.map.setView(bounds[0], 15);
        } else {
          this.map.fitBounds(bounds, {
            reset: true,
            maxZoom: 18
          });
        }
      }
    },

    style: function(feature) {
      return {
        color: feature.properties.color,
        opacity: 1,
        fillColor: feature.properties.color
      };
    },

    addZone: function(event) {
      var type  = event.layerType,
          layer = event.layer;

      // Style zones with a unique color
      // TODO: Add more colors.
      // We only have 6 colors right now.
      var zoneNumber = this.zones.length;
      var color = settings.colorRange[zoneNumber + 1];
      layer.setStyle({
        color: color,
        opacity: 1,
        fillColor: color
      });

      // Create a new zone model
      var geoJSON = layer.toGeoJSON();
      geoJSON.properties = {
        name: 'Zone ' + (this.zones.length + 1),
        color: color
      };
      // Add the zone layer to the layerGroup
      this.drawnItems.addLayer(layer);

      // Save the layer to the model
      geoJSON.layer = layer;
      var zone = new Zones.Model(geoJSON);
      this.zones.push(zone);

      // Render the form
      $('#map-zones').html(this.zonesTemplate({
        zones: this.zones.toJSON()
      }));
    },

    /**
     * Render surveyor zones on the map
     */
    renderZones: function() {
      var zones, layer;

      // If the survey already has zones, render them
      if(this.survey.get('zones')) {
        zones = this.survey.get('zones');

        // Add each zone to the map
        _.each(zones, function(zone) {
          layer = L.geoJson(zone, {
            style: this.style
          });
          this.drawnItems.addLayer(layer);
          zone.layer = layer;
        }.bind(this));

        this.zones.reset(zones);
      }

      // Renter the form for the zones
      $('#map-zones').html(this.zonesTemplate({
        zones: this.zones.toJSON()
      }));
    },

    removeZone: function(event) {
      var index = $(event.target).attr('data-index');
      var model = this.zones.at(index);

      // TODO: Remove the layer
      this.drawnItems.removeLayer(model.get('layer'));
      this.zones.remove(model);
      $(event.target).parent().remove();
    },

    getZones: function() {
      // Update the names
      $('#survey-zone-form input').each(function(index, $input) {
        this.zones.at(index).attributes.properties.name = $input.value;
      }.bind(this));
      return this.zones.toJSON();
    }

  });

  return MapDrawView;

});
